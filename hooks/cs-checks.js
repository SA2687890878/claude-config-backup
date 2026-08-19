#!/usr/bin/env node
/**
 * 语言检查 Hook（PostToolUse）— 合并 cs-guard + vue-guard
 * 一次启动、一次 stdin，覆盖 C# 和 Vue 的代码检查。
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
    if (!filePath) return;
    const ext = path.extname(filePath).toLowerCase();
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (!content || content.length < 50) return;

    if (ext === '.cs') {
      checkCSharp(content, filePath);
    } else if (ext === '.vue') {
      checkVue(content, filePath);
    }
  } catch (e) { console.error('[cs-checks] Error:', e.message); }
});

function checkCSharp(content, filePath) {
  const warnings = [];
  const blocks = [];

  // 语法
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) warnings.push(`Brace mismatch: { = ${openBraces}, } = ${closeBraces}`);
  if (/async\s+\w+/.test(content) && !/await\s/.test(content) && !/Task\.Run/.test(content)) warnings.push('Async method without await');
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(content)) warnings.push('Empty catch block');

  // 禁止模式
  if (/(?<!\w)\.Result\b/.test(content) && /Task/.test(content)) blocks.push('.Result sync blocking — 使用 await');
  if (/(?<!\w)\.Wait\s*\(\s*\)/.test(content) && /Task/.test(content)) blocks.push('.Wait() sync blocking — 使用 await');
  if (/["`]\s*(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN)\s+.*["`]\s*\+/gi.test(content)) blocks.push('可能的 SQL 注入风险（字符串拼接 SQL）');

  if (blocks.length > 0) {
    console.error(`\n[cs-checks] ❌ ${path.basename(filePath)} 触犯红线:`);
    blocks.forEach(b => console.error(`  🔴 ${b}`));
  }
  if (warnings.length > 0) {
    console.error(`[cs-checks] ⚠ ${path.basename(filePath)} 建议:`);
    warnings.forEach(w => console.error(`  ⚠ ${w}`));
  }
}

function checkVue(content, filePath) {
  const warnings = [];
  const lines = content.split('\n');

  // $t() 在 data() 中使用
  let inData = false, braceDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/data\s*\(\s*\)\s*\{/.test(line)) { inData = true; braceDepth = 1; continue; }
    if (inData) {
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) { inData = false; continue; }
      if (/\$t\s*\(/.test(line)) warnings.push(`L${i + 1}: $t() 不能用在 data()（i18n 未就绪）。改用 computed。`);
    }
  }

  // v-for 缺少 :key
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/v-for\s*=/.test(line) && !/:\s*key/.test(line) && !/v-bind\s*:\s*key/.test(line)) {
      const next = i + 1 < lines.length ? lines[i + 1] : '';
      if (!/:\s*key/.test(next)) warnings.push(`L${i + 1}: v-for 缺少 :key 绑定。`);
    }
  }

  if (warnings.length > 0) {
    console.error(`\n[cs-checks] ⚠ ${path.basename(filePath)}:`);
    warnings.forEach(w => console.error(`  ${w}`));
  }
}