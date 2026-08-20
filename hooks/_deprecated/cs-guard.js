#!/usr/bin/env node
/**
 * C# Guard Hook (PostToolUse) — 合并版
 * 合并了原 cs-guard + quality-guard + logic-guard 三个 hooks。
 * 一次启动、一次 stdin 读取、一次文件检查，覆盖所有 C# 检查。
 *
 * 检查类别：
 *   1. 语法：braces/async without await/empty catch/.Result/.Wait()
 *   2. 质量：SQL 注入/null 安全/资源释放/CancellationToken/异常处理
 *   3. 逻辑：foreach await/string order/dispose after use/Task.Run sync
 */
const path = require('path');

// ===== 1. 语法检查 =====

function checkSyntax(content, lines) {
  const warnings = [];
  const blocks = [];

  // Brace mismatch
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) warnings.push('Brace mismatch: { = ' + openBraces + ', } = ' + closeBraces);

  // Async method without await
  if (/async\s+\w+/.test(content) && !/await\s/.test(content) && !/Task\.Run/.test(content)) warnings.push('Async method without await');

  // Empty catch block
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) warnings.push('Empty catch block');

  // .Result sync blocking (CLAUDE.md 禁止)
  if (/(?<!\w)\.Result\b/.test(content) && /Task/.test(content)) blocks.push('.Result sync blocking — 必须使用 await');

  // .Wait() sync blocking (CLAUDE.md 禁止)
  if (/(?<!\w)\.Wait\s*\(\s*\)/.test(content) && /Task/.test(content)) blocks.push('.Wait() sync blocking — 必须使用 await');

  return { warnings, blocks };
}

// ===== 2. 质量检查 =====

const PATTERN_CHECKS = [
  { re: /["`]\s*(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN)\s+.*["`]\s*\+/gi, msg: '可能的 SQL 注入风险（字符串拼接 SQL）', tag: '⚠', level: 'block' },
  { re: /["']\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?["']/g, msg: '硬编码 IP 地址', tag: '⚠', level: 'warn' },
  { re: /(?:port|Port)\s*[:=]\s*(?!80\b|443\b|8080\b)\d{2,5}/g, msg: '硬编码端口号', tag: '⚠', level: 'warn' },
  { re: /\/\/\s*(?:TODO|FIXME|HACK|XXX|TEMP)\b/gi, msg: '遗留的 TODO/FIXME 标记', tag: '📝', level: 'warn' },
  { re: /\/\/\s*(?:if\s*\(|for\s*\(|while\s*\(|var\s+\w+\s*=|return\s+\w+\s*;|public\s+\w+|private\s+\w+|protected\s+\w+)/g, msg: '注释掉的代码（考虑删除）', tag: '💡', level: 'warn' },
];

function checkNullSafety(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(?:Find|FirstOrDefault|SingleOrDefault|First|Single)(?:Async)?\s*\(/.test(lines[i])) continue;
    let hasNullCheck = false;
    let propLine = -1;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const ln = lines[j].trim();
      if (/if\s*\(|==\s*null|!=\s*null|\?\.|\.HasValue|null\s*\?/.test(ln)) { hasNullCheck = true; break; }
      if (/\w+\.\w+/.test(ln) && !/^\s*\/\//.test(ln)) { propLine = j + 1; break; }
    }
    if (propLine > 0 && !hasNullCheck) out.push(`Find/FirstOrDefault 后未检查 null（第 ${propLine} 行）`);
  }
  return out;
}

function checkResourceDisposal(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/new\s+(?:SqlConnection|HttpClient|FileStream|StreamReader|StreamWriter|MemoryStream|WebClient|TcpClient|UdpClient)\b/.test(ln)) continue;
    if (/using\s/.test(ln)) continue;
    let hasUsing = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (/using\s/.test(lines[j])) { hasUsing = true; break; }
    }
    if (!hasUsing) out.push(`资源未 using 释放（第 ${i + 1} 行）`);
  }
  return out;
}

function checkCancellationToken(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(?:public|private|protected|internal)\s+async\s+Task/.test(lines[i])) continue;
    if (/CancellationToken/.test(lines[i])) continue;
    let hasAsyncDb = false;
    for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      if (/(?:ToListAsync|FirstOrDefaultAsync|FindAsync|SaveChangesAsync|ExecuteSqlRawAsync)\s*\(/.test(lines[j])) { hasAsyncDb = true; break; }
    }
    if (hasAsyncDb) out.push(`async 方法缺少 CancellationToken（第 ${i + 1} 行）`);
  }
  return out;
}

function checkExceptionHandling(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/catch\s*\(\s*Exception\s*(?:\w+)?\s*\)/.test(lines[i].trim())) continue;
    let hasContent = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const ln = lines[j].trim();
      if (ln && !ln.startsWith('//') && ln !== '{' && ln !== '}') { hasContent = true; break; }
    }
    if (!hasContent) out.push(`catch (Exception) 块为空（第 ${i + 1} 行）— 至少记录日志`);
  }
  return out;
}

function checkQuality(content, lines) {
  const warnings = [];
  const blocks = [];

  // Pattern checks
  for (const chk of PATTERN_CHECKS) {
    const m = content.match(chk.re);
    if (m && m.length > 0) {
      const msg = `${chk.tag} ${chk.msg}（${m.length} 处）`;
      if (chk.level === 'block') blocks.push(msg);
      else warnings.push(msg);
    }
  }

  // Logic checks
  const nullSafety = checkNullSafety(lines);
  const resourceDisposal = checkResourceDisposal(lines);
  const cancellationToken = checkCancellationToken(lines);
  const exceptionHandling = checkExceptionHandling(lines);

  blocks.push(...nullSafety);
  blocks.push(...resourceDisposal);
  blocks.push(...exceptionHandling);
  warnings.push(...cancellationToken);

  return { warnings, blocks };
}

// ===== 3. 逻辑检查 =====

function checkForeachAwait(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/foreach\s*\(/.test(lines[i].trim())) continue;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      const inner = lines[j].trim();
      if (inner === '}') break;
      if (/await\s+/.test(inner) && !/Task\.WhenAll|Task\.WhenAny/.test(inner)) {
        out.push(`foreach 中直接 await 异步操作（第 ${i + 1} 行），应考虑 Task.WhenAll 或 Parallel.ForEachAsync`);
        break;
      }
    }
  }
  return out;
}

function checkStringOrder(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/string\.IsNullOrEmpty\(.*\)\.Trim\(\)/.test(ln)) out.push(`string.IsNullOrEmpty 后调用 .Trim()（第 ${i + 1} 行）—— 可能 NullReferenceException`);
    if (/==\s*null\s*\|\|\s*==\s*""\s/.test(ln) || /=\s*null\s*\|\|\s*=\s*""\s/.test(ln)) out.push(`== null || == ""（第 ${i + 1} 行）—— 应使用 string.IsNullOrEmpty()`);
    if (/!=\s*null\s*&&\s*!=\s*""\s/.test(ln)) out.push(`!= null && != ""（第 ${i + 1} 行）—— 应使用 !string.IsNullOrEmpty()`);
  }
  return out;
}

function checkDisposeAfterUse(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/\.Dispose\(\)/.test(ln)) continue;
    const match = ln.match(/(\w+)\.Dispose\(\)/);
    if (!match) continue;
    const varName = match[1];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const nextLn = lines[j].trim();
      if (nextLn.includes(varName + '.') && !/^\s*\/\//.test(nextLn)) {
        out.push(`Dispose 后继续使用 ${varName}（第 ${j + 1} 行）`);
        break;
      }
    }
  }
  return out;
}

function checkTaskRunSync(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/Task\.Run\s*\(\s*\(\)\s*=>\s*\{/.test(lines[i].trim())) continue;
    let hasAsync = false;
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      if (/await\s+/.test(lines[j])) { hasAsync = true; break; }
      if (/\}\)/.test(lines[j])) break;
    }
    if (!hasAsync) out.push(`Task.Run 包装同步代码（第 ${i + 1} 行）—— 无意义的异步包装`);
  }
  return out;
}

function checkEmptyCatchWithReturn(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/catch\s*\(/.test(lines[i].trim())) continue;
    let catchContent = '';
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const inner = lines[j].trim();
      if (inner === '}') break;
      catchContent += inner + ' ';
    }
    if (catchContent.trim() && catchContent.trim() !== '// TODO') continue;
    for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
      if (/try\s*\{/.test(lines[k])) {
        for (let m = k + 1; m < i; m++) {
          if (/return\s/.test(lines[m])) {
            out.push(`try 中有 return，但 catch 为空（第 ${i + 1} 行）—— 异常被静默吞掉`);
            break;
          }
        }
        break;
      }
    }
  }
  return out;
}

function checkLogic(lines) {
  const warnings = [];
  const blocks = [];

  const checks = [
    { fn: checkStringOrder, level: 'block' },
    { fn: checkDisposeAfterUse, level: 'block' },
    { fn: checkEmptyCatchWithReturn, level: 'block' },
    { fn: checkForeachAwait, level: 'warn' },
    { fn: checkTaskRunSync, level: 'warn' },
  ];

  for (const check of checks) {
    const results = check.fn(lines);
    if (check.level === 'block') blocks.push(...results);
    else warnings.push(...results);
  }

  return { warnings, blocks };
}

// ===== Main =====

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/[.]cs$/i.test(filePath)) return;

    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (!content || content.length < 20) return;

    const fileName = path.basename(filePath);
    const lines = content.split('\n');

    // 运行三类检查
    const syntax = checkSyntax(content, lines);
    const quality = checkQuality(content, lines);
    const logic = checkLogic(lines);

    // 合并结果
    const allBlocks = [...syntax.blocks, ...quality.blocks, ...logic.blocks];
    const allWarnings = [...syntax.warnings, ...quality.warnings, ...logic.warnings];

    // 输出
    if (allBlocks.length > 0) {
      console.error(`\n[C# Guard] ${fileName}:`);
      allBlocks.forEach(w => console.error(`  🚫 ${w}`));
      console.error('[C# Guard] ⚠️ 请修复上述问题。');
    }

    if (allWarnings.length > 0) {
      console.error(`\n[C# Guard] ${fileName}:`);
      allWarnings.forEach(w => console.error(`  ⚠️ ${w}`));
      console.error('');
    }
  } catch (e) { console.error('[cs-guard] Error:', e.message); }
});
