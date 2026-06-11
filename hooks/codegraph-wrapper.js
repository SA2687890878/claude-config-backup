#!/usr/bin/env node
/**
 * CodeGraph Wrapper - 自动检测项目路径并启动 codegraph
 */
const { execSync } = require('child_process');
const path = require('path');

// 获取当前工作目录（Claude Code 的工作目录）
const projectPath = process.cwd();

// 启动 codegraph，传递项目路径
const args = ['serve', '--mcp', '--path', `"${projectPath}"`];
const cmd = `codegraph ${args.join(' ')}`;

// 使用 spawn 转发 stdio
const { spawn } = require('child_process');
const child = spawn('codegraph', ['serve', '--mcp', '--path', projectPath], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start codegraph:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
