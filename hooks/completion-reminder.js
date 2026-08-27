#!/usr/bin/env node
/**
 * 完成提醒 Hook（PostToolUse）— 合并 test-reminder + review-trigger
 * 写代码/配置文件后，输出一条综合提醒：需审查和/或需测试。
 */
const path = require('path');
const fs = require('fs');
const { findTestProject } = require('./shared-utils');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!filePath) return;
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    const lineCount = content ? content.split('\n').length : 0;
    if (lineCount < 50) return;

    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const isTestFile = /[\\/](Tests?|Test)[\\/]/i.test(filePath);
    const reminders = [];

    // 审查提醒：.cs/.vue/.sql 且非测试文件
    if (/\.(cs|vue|sql|env)$/i.test(filePath) && !isTestFile) {
      reminders.push(`运行 /review 审查 ${fileName}`);
    }
    // 配置文件提醒
    if (/appsettings.*\.json$/i.test(filePath)) {
      reminders.push(`审查 ${fileName}（配置安全）`);
    }
    // 测试提醒：.cs 且非测试文件
    if (ext === '.cs' && !isTestFile) {
      const testProj = findTestProject(filePath);
      if (testProj) reminders.push(`运行 dotnet test "${testProj}"`);
    }

    if (reminders.length > 0) {
      console.error(`\n[completion-reminder] ${fileName}:`);
      reminders.forEach(r => console.error(`  → ${r}`));
    }
  } catch (e) { console.error('[completion-reminder] Error:', e.message); }
});