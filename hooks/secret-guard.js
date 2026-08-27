#!/usr/bin/env node
/**
 * Secret Guard Hook (PreToolUse)
 * Scans Write/Edit content and Bash commands for hardcoded secrets.
 */
const { FILE_CONTENT_PATTERNS, BASH_COMMAND_PATTERNS } = require('./secret-patterns');

const SKIP_PATTERNS = [/\.(md|txt|rst)$/i, /\.example$/i, /README/i, /CHANGELOG/i];
const SAFE_CONTENT = [/$\{?\w+\}?/, /Environment\.GetEnvironmentVariable/i, /process\.env\./i];

// 只跳过安全的 git 只读命令（不跳过 push/commit，让检测覆盖）
const SAFE_BASH_PATTERNS = [/\$\{?\w+\}?/, /rtk\s+/, /\bgit\s+(?:status|log|diff|branch|show|remote|fetch|stash\s+list)\b/];

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // ===== Bash 命令检测 =====
    if (toolName === 'Bash') {
      const command = (input.tool_input && input.tool_input.command) || '';
      if (!command || command.length < 5) return;

      // 跳过安全命令
      if (SAFE_BASH_PATTERNS.some(p => p.test(command))) return;

      const findings = [];
      for (const { pattern, label } of BASH_COMMAND_PATTERNS) {
        const match = command.match(pattern);
        if (match) {
          const matchedText = match[0];
          const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
          if (!isSafe) findings.push({ label, matched: matchedText.substring(0, 60) });
        }
      }
      if (findings.length > 0) {
        console.error('[Hook] BLOCKED: Potential secret leak in Bash command');
        findings.forEach(f => console.error('[Hook]   - ' + f.label + ': "' + f.matched + '..."'));
        console.error('[Hook] Use environment variables or secrets manager instead.');
        process.exit(2);
      }
      return;
    }

    // ===== Write/Edit 文件内容检测 =====
    if (toolName !== 'Write' && toolName !== 'Edit') return;
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (SKIP_PATTERNS.some(p => p.test(filePath))) return;
    if (!content || content.length < 10) return;
    const findings = [];
    for (const { pattern, label } of FILE_CONTENT_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        const matchedText = match[0];
        const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
        if (!isSafe) findings.push({ label, matched: matchedText.substring(0, 60) });
      }
    }
    if (findings.length > 0) {
      console.error('[Hook] BLOCKED: Potential hardcoded secrets detected');
      findings.forEach(f => console.error('[Hook]   - ' + f.label + ': "' + f.matched + '..."'));
      console.error('[Hook] Use environment variables or secrets manager instead.');
      process.exit(2);
    }
  } catch (e) { console.error('[secret-guard] Error:', e.message); }
});
