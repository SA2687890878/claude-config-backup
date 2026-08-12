#!/usr/bin/env node
/**
 * Bash 失败检测 Hook (PostToolUse)
 *
 * 功能：追踪连续 Bash 失败，注入失败模式分析上下文
 * 借鉴：PUA failure-detector.sh 的模式分类逻辑
 *
 * 行为：
 * - 连续失败 2 次：注入"建议换方案"上下文
 * - 连续失败 3+ 次：注入"强制换方案"上下文
 * - 成功：重置计数（如有失败历史则输出突破确认）
 *
 * 符合 Claude 官方 hook 规范
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
const STATE_DIR = path.join(HOME, '.claude', 'state');
const COUNTER_FILE = path.join(STATE_DIR, 'failure_count');
const HISTORY_FILE = path.join(STATE_DIR, 'failure_history.jsonl');

// ============================================================
// 工具函数
// ============================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readCounter() {
  try {
    return parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim(), 10) || 0;
  } catch { return 0; }
}

function writeCounter(n) {
  ensureDir(STATE_DIR);
  fs.writeFileSync(COUNTER_FILE, String(n), 'utf8');
}

function appendHistory(entry) {
  try {
    ensureDir(STATE_DIR);
    fs.appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch { /* 忽略写入失败 */ }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

// ============================================================
// 失败检测
// ============================================================

function isFailure(input) {
  const result = input.tool_result;

  // 优先检查 exit_code（确定性信号）
  if (result && typeof result === 'object') {
    const exitCode = result.exit_code ?? result.exitCode;
    if (exitCode !== undefined && exitCode !== 0 && exitCode !== '0') return true;
  }

  // 降级：检查错误文本模式（仅在 exit_code 不可用时）
  const text = typeof result === 'string' ? result :
    (result && result.content ? (typeof result.content === 'string' ? result.content : '') : '');

  if (!text) return false;

  // 锚定匹配，避免 "0 failed" 等误报
  return /^(error:|fatal:|panic:|Traceback \(most recent|Exception:|command not found|No such file or directory|Permission denied)/im.test(text);
}

function extractSignature(input) {
  const result = input.tool_result;
  const text = typeof result === 'string' ? result :
    (result && result.content ? (typeof result.content === 'string' ? result.content : '') : '');
  const command = (input.tool_input && input.tool_input.command) || '';

  // 提取错误类型
  let errorType = 'unknown';
  if (/NullReferenceException/i.test(text)) errorType = 'NRE';
  else if (/CS\d{4}/.test(text)) errorType = text.match(/(CS\d{4})/)?.[1] || 'BuildError';
  else if (/TimeoutException/i.test(text)) errorType = 'Timeout';
  else if (/Assert\./i.test(text)) errorType = 'AssertFail';
  else if (/Traceback|Exception/i.test(text)) errorType = text.match(/(\w+Exception|\w+Error)/)?.[1] || 'Exception';
  else if (/error:|fatal:/i.test(text)) errorType = 'CLIError';
  else if (/Permission denied/i.test(text)) errorType = 'Permission';
  else if (/No such file/i.test(text)) errorType = 'FileNotFound';

  // 提取位置（从命令或错误文本中）
  const fileMatch = text.match(/(?:at |in |File ")([^\s:"]+)(?::(\d+))?/) ||
                    command.match(/(?:cd|cat|node|python|dotnet)\s+([^\s]+)/);
  const location = fileMatch ? fileMatch[1].split(/[/\\]/).pop() : 'unknown';

  return `${errorType}:${location}`;
}

// ============================================================
// 注入消息生成
// ============================================================

function generateMessage(count, signatures) {
  if (count === 2) {
    return [
      `[failure-detector] 连续失败 ${count} 次。`,
      `错误签名：${signatures.join(' → ')}`,
      ``,
      `建议：当前方案可能不对。在尝试下一个方案前：`,
      `1. 检查两次失败的签名是否相同 → 相同说明在原地打转`,
      `2. 如果在原地打转：列出 3 个本质不同的方案（不同算法/不同库/不同架构层）`,
      `3. 换参数、换变量名 ≠ 换方案`,
    ].join('\n');
  }

  // 3+ 次
  return [
    `[failure-detector] 连续失败 ${count} 次。强制换方案。`,
    `错误签名：${signatures.join(' → ')}`,
    ``,
    `你当前的方案已证明无效。必须：`,
    `1. 停止当前方法（包括参数微调和微小变体）`,
    `2. 列出 3 个本质不同的方案`,
    `3. 每个方案必须有结构性差异（不同算法/不同库/不同层/不同范式）`,
    `4. 评估后选择一个执行`,
    ``,
    `如果已尝试 5+ 次仍未解决 → 这可能是架构问题，和用户讨论。`,
  ].join('\n');
}

// 输出消息：stderr 给用户看，additionalContext 注入 Claude 上下文（PostToolUse 协议）
function emitContext(msg) {
  process.stderr.write('\n' + msg + '\n');
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: msg
    }
  }));
}

// ============================================================
// 主逻辑
// ============================================================

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);

    // 只处理 Bash
    if (input.tool_name !== 'Bash') process.exit(0);

    const failed = isFailure(input);

    if (failed) {
      const count = readCounter() + 1;
      writeCounter(count);

      const signature = extractSignature(input);

      // 读取历史签名（最近 5 条）
      let recentSignatures = [];
      try {
        const lines = fs.readFileSync(HISTORY_FILE, 'utf8').trim().split('\n').filter(Boolean);
        recentSignatures = lines.slice(-4).map(l => {
          try { return JSON.parse(l).signature; } catch { return '?'; }
        });
      } catch { /* 文件不存在 */ }
      recentSignatures.push(signature);

      // 记录本次失败
      appendHistory({
        ts: Date.now(),
        signature,
        command: (input.tool_input?.command || '').substring(0, 200),
        count
      });

      // 2+ 次失败时注入上下文（stderr 给用户 + additionalContext 给 Claude）
      if (count >= 2) {
        const msg = generateMessage(count, recentSignatures.slice(-3));
        emitContext(msg);
      }
    } else {
      // 成功：如果之前有失败，输出突破确认
      const prevCount = readCounter();
      if (prevCount >= 2) {
        emitContext(`[failure-detector] 突破成功，连续失败 ${prevCount} 次后解决。建议复盘：刚才卡了 ${prevCount} 次，根因是什么？`);
      }
      writeCounter(0);
    }

    process.exit(0);
  } catch (e) {
    process.stderr.write('[failure-detector] Error: ' + e.message + '\n');
    process.exit(0);
  }
})();
