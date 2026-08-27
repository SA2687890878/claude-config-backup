#!/usr/bin/env node
/**
 * Bash Guard Hook (PreToolUse)
 * 拦截危险的 Bash 命令：rm -rf、DROP TABLE、TRUNCATE、DELETE 无 WHERE 等
 *
 * Stdin:  JSON { tool_name, tool_input }
 * stderr: User-facing warnings
 * stdout: JSON { decision: 'block', reason: '...' }
 */
const path = require('path');
const { getGitSecurityPatterns } = require('./shared-utils');

// ===== 危险命令模式 =====

const DANGEROUS_PATTERNS = [
  // 文件系统破坏
  {
    re: /\brm\s+(?:-[a-zA-Z]*f[a-zA-Z]*\s+|-rf\s+|--force\s+|--recursive\s+)(?:\/|~|\.\.?)/gi,
    msg: 'rm -rf 可能删除重要文件',
    level: 'block'
  },
  {
    re: /\brmdir\s+\/[a-zA-Z]/gi,
    msg: 'rmdir 删除根目录文件',
    level: 'block'
  },
  // 数据库破坏
  {
    re: /\bDROP\s+TABLE\b/gi,
    msg: 'DROP TABLE 删除整个表',
    level: 'block'
  },
  {
    re: /\bDROP\s+DATABASE\b/gi,
    msg: 'DROP DATABASE 删除整个数据库',
    level: 'block'
  },
  {
    re: /\bTRUNCATE\s+TABLE\b/gi,
    msg: 'TRUNCATE TABLE 清空表数据',
    level: 'block'
  },
  {
    re: /\bDELETE\s+FROM\s+\w+\s*(?:;|$)/gi,
    msg: 'DELETE FROM 缺少 WHERE 条件，会删除所有数据',
    level: 'block'
  },
  {
    re: /\bUPDATE\s+\w+\s+SET\b(?![\s\S]*?\bWHERE\b)/gi,
    msg: 'UPDATE 缺少 WHERE 条件，会更新所有行',
    level: 'block'
  },
  // 权限风险
  {
    re: /\bchmod\s+777\b/gi,
    msg: 'chmod 777 赋予所有用户完全权限',
    level: 'block'
  }
];

// Add git security patterns from shared module
const gitPatterns = getGitSecurityPatterns();
for (const pattern of gitPatterns) {
  DANGEROUS_PATTERNS.push({
    re: pattern.pattern,
    msg: pattern.description,
    level: pattern.level
  });
}

// ===== Main =====
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Bash') return;

    const command = (input.tool_input && input.tool_input.command) || '';
    if (!command) return;

    // rtk 包装命令：剥离 rtk 前缀后用原始命令做安全检查，防止绕过危险拦截
    // 例：git checkout -- . 被 rtk 重写为 "rtk git checkout -- ." 后仍需拦截
    const checkCmd = command.replace(/^\s*rtk\s+(?:proxy\s+)?/, '');

    // 跳过安全的 git 子命令（不跳过危险操作，让 DANGEROUS_PATTERNS 拦截）
    if (/^\s*git\s+(?:status|log|diff|branch|show|remote|fetch|pull|stash\s+list)\b/.test(checkCmd)) return;

    // 检查危险模式
    const found = [];
    for (const pattern of DANGEROUS_PATTERNS) {
      const match = checkCmd.match(pattern.re);
      if (match) {
        found.push({ msg: pattern.msg, level: pattern.level });
      }
    }

    if (found.length === 0) return;

    // 输出检测结果
    console.error('\n[Bash Guard] 检测到危险命令：');
    found.forEach(f => console.error(`  🚫 ${f.msg}`));

    // 如果有 block 级别的问题，阻断操作
    const hasBlock = found.some(f => f.level === 'block');
    if (hasBlock) {
      console.log(JSON.stringify({
        decision: 'block',
        reason: `[bash-guard] 检测到危险命令：${found.map(f => f.msg).join('；')}。请确认是否需要执行此操作。`
      }));
    }
  } catch (e) {
    console.error("[Hook Error] bash-guard: " + e.message);
  }
});
