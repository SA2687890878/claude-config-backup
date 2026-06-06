#!/usr/bin/env node
/**
 * C# Guard Hook (PostToolUse)
 * After Write/Edit on .cs files, performs quick syntax checks.
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
    const fileName = path.basename(filePath);
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) warnings.push('Brace mismatch: { = ' + openBraces + ', } = ' + closeBraces);
    if (/async\s+\w+/.test(content) && !/await\s/.test(content) && !/Task\.Run/.test(content)) warnings.push('Async method without await');
    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) warnings.push('Empty catch block');
    if (/\.\s*Result\b/.test(content)) warnings.push('.Result sync blocking — use await');
    if (/\.\s*Wait\s*\(\s*\)/.test(content)) warnings.push('.Wait() sync blocking — use await');
    if (warnings.length > 0) {
      console.error('[C# Guard] ' + fileName + ':');
      warnings.forEach(w => console.error('  ⚠ ' + w));
      console.error('[C# Guard] Run rtk dotnet build to verify.');
    }
  } catch (e) { }
});
