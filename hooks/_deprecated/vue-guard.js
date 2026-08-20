#!/usr/bin/env node
/**
 * Vue Guard Hook (PostToolUse)
 * Vue 2 / Element UI 代码检查：
 * - $t() 在 data() 中使用 → 警告
 * - formRules 在 data 中定义 → 警告
 * - v-for 缺少 :key → 警告
 *
 * Stdin:  JSON { tool_name, tool_input, tool_output }
 * Stderr: User-facing warnings (shown in UI)
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/[.]vue$/i.test(filePath)) return;

    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (!content || content.length < 50) return;

    const warnings = [];
    const lines = content.split('\n');

    // 检查 $t() 在 data() 中使用
    let inData = false;
    let braceDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/data\s*\(\s*\)\s*\{/.test(line)) {
        inData = true;
        braceDepth = 1;
        continue;
      }
      if (inData) {
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        if (braceDepth <= 0) { inData = false; continue; }
        if (/\$t\s*\(/.test(line)) {
          warnings.push(`⚠ 第 ${i + 1} 行: $t() 不能在 data() 中使用（i18n 未就绪）。改用 computed。`);
        }
      }
    }

    // 检查 formRules 在 data 中定义
    let inData2 = false;
    let braceDepth2 = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/data\s*\(\s*\)\s*\{/.test(line)) {
        inData2 = true;
        braceDepth2 = 1;
        continue;
      }
      if (inData2) {
        braceDepth2 += (line.match(/\{/g) || []).length;
        braceDepth2 -= (line.match(/\}/g) || []).length;
        if (braceDepth2 <= 0) { inData2 = false; continue; }
        if (/formRules\s*:/.test(line) || /itemFormRules\s*:/.test(line)) {
          warnings.push(`⚠ 第 ${i + 1} 行: formRules 应定义在 computed 中，而非 data() 中（需要 this.$t()）。`);
        }
      }
    }

    // 检查 v-for 缺少 :key
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/v-for\s*=/.test(line) && !/:\s*key/.test(line) && !/v-bind\s*:\s*key/.test(line)) {
        // 检查同一行或下一行是否有 :key
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        if (!/:\s*key/.test(nextLine)) {
          warnings.push(`⚠ 第 ${i + 1} 行: v-for 缺少 :key 绑定。`);
        }
      }
    }

    if (warnings.length > 0) {
      console.error(`\n[Vue Guard] ${filePath.split('/').pop()}:`);
      warnings.forEach(w => console.error(`  ${w}`));
      console.error('');
    }
  } catch (e) { console.error('[vue-guard] Error:', e.message); }
});
