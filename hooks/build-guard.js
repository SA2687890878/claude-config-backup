#!/usr/bin/env node
/**
 * Build Guard Hook (PostToolUse)
 * Reminds to run build after .cs file edits.
 * Stateless — no temp files, no cross-invocation state.
 *
 * Stdin:  JSON { tool_name, tool_input, tool_output }
 * Stderr: User-facing warning (shown in UI)
 */
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理 Write/Edit
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/[.]cs$/i.test(filePath)) return;

    // 只在 Write（新文件）或 Edit 内容较长时提示，减少噪音
    if (toolName === 'Edit') {
      const newString = (input.tool_input && input.tool_input.new_string) || '';
      if (newString.length < 100) return;
    }

    const fileName = path.basename(filePath);
    console.error(`\n[Build Guard] 已修改 ${fileName} — 建议运行: rtk dotnet build\n`);
  } catch (e) { }
});
