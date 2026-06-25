#!/usr/bin/env node
/**
 * Impact Guard Hook (PreToolUse)
 * 编辑 .cs 文件前，提示检查调用链影响。
 * 非 .cs 文件静默退出，不消耗 token。
 */
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
    if (!content || content.length < 50) return;
    console.error('[Impact Guard] 即将编辑 .cs 文件。建议先检查调用链影响（CodeGraph impact 或 search.ps1 -Callers）。');
  } catch (e) { console.error('[impact-guard] Error:', e.message); }
});
