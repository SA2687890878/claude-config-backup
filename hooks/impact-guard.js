#!/usr/bin/env node
/**
 * Impact Guard Hook (PreToolUse)
 * Warns before modifying existing .cs files.
 * Suggests running codegraph_callers to check impact.
 *
 * Stdin:  JSON { tool_name, tool_input }
 * Stderr: User-facing warning (shown in UI)
 * Exit:   0 (warn only, never blocks)
 */
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理 Edit（修改现有文件），不处理 Write（新建文件）
    if (toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/[.]cs$/i.test(filePath)) return;

    const fileName = path.basename(filePath);
    console.error(`\n[Impact Guard] 正在修改 ${fileName} — 建议先运行 codegraph_callers 查看调用链\n`);
  } catch (e) { console.error("[Hook Error] impact-guard: " + e.message); }
});
