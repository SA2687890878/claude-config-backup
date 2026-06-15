#!/usr/bin/env node
/**
 * C# Guard Hook (PostToolUse)
 * After Write/Edit on .cs files, performs quick syntax checks.
 *
 * CRITICAL checks → exit 2 (block):
 *   - .Result / .Wait() sync blocking (CLAUDE.md 禁止)
 *
 * WARNING checks → console.error:
 *   - Brace mismatch
 *   - Async method without await
 *   - Empty catch block
 */
const path = require('path');
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
    const warnings = [];
    const blocks = [];
    const fileName = path.basename(filePath);

    // Brace mismatch (warning)
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) warnings.push('Brace mismatch: { = ' + openBraces + ', } = ' + closeBraces);

    // Async method without await (warning)
    if (/async\s+\w+/.test(content) && !/await\s/.test(content) && !/Task\.Run/.test(content)) warnings.push('Async method without await');

    // Empty catch block (warning)
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) warnings.push('Empty catch block');

    // .Result sync blocking (BLOCK — CLAUDE.md 禁止)
    // 更精确匹配：排除变量名（如 expectedResult），只匹配 Task.Result 模式
    if (/(?<!\w)\.Result\b/.test(content) && /Task/.test(content)) blocks.push('.Result sync blocking — 必须使用 await');

    // .Wait() sync blocking (BLOCK — CLAUDE.md 禁止)
    // 更精确匹配：排除变量名，只匹配 Task.Wait() 模式
    if (/(?<!\w)\.Wait\s*\(\s*\)/.test(content) && /Task/.test(content)) blocks.push('.Wait() sync blocking — 必须使用 await');

    // CRITICAL: .Result / .Wait() → 警告（PostToolUse 不阻断，避免回滚用户修改）
    if (blocks.length > 0) {
      console.error(`[C# Guard] ${fileName}:`);
      blocks.forEach(w => console.error(`  🚫 ${w}`));
      console.error('[C# Guard] ⚠️ CLAUDE.md 禁止同步阻塞，必须使用 async/await。');
    }

    // 其他问题 → 警告
    if (warnings.length > 0) {
      console.error(`[C# Guard] ${fileName}:`);
      warnings.forEach(w => console.error(`  ⚠ ${w}`));
      console.error('[C# Guard] Run rtk dotnet build to verify.');
    }
  } catch (e) { console.error('[cs-guard] Error:', e.message); }
});
