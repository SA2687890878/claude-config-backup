#!/usr/bin/env node
/**
 * Encrypted Write Guard Hook (PreToolUse)
 * 当 Edit/Write 工具修改加密项目中的 .cs 文件时，输出警告。
 *
 * DGClient 加密文件通过 Claude Code 的 Edit/Write 工具写入时，
 * 可能破坏加密格式。此 hook 提醒用户注意风险。
 *
 * 注意：此 hook 仅警告不拦截，因为 Edit 工具是修改加密文件的唯一方式。
 */
const fs = require('fs');
const path = require('path');

// 加密项目目录列表
const ENCRYPTED_DIRS = [
  'F:/Code WorkSpace/',
  'F:/OTD Code WorkSpace/'
];

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!filePath) return;

    // 只检查 .cs 文件
    if (!/[.]cs$/i.test(filePath)) return;

    // 检查是否在加密项目目录中（统一路径分隔符）
    const normalizedPath = filePath.replace(/\\/g, '/');
    const isEncrypted = ENCRYPTED_DIRS.some(dir => normalizedPath.startsWith(dir));
    if (!isEncrypted) return;

    // 输出警告
    console.error('');
    console.error('[Encrypted Write Guard] ⚠️ 此文件在 DGClient 加密项目中:');
    console.error(`  文件: ${path.basename(filePath)}`);
    console.error('  风险: Edit/Write 工具可能破坏加密格式');
    console.error('  建议: 如需大量修改，考虑使用 PowerShell 脚本编辑');
    console.error('  参考: ~/.claude/rules/tools/code-access.md');
    console.error('');

  } catch (e) { console.error('[encrypted-write-guard] Error:', e.message); }
});
