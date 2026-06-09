#!/usr/bin/env node
/**
 * SQLite Index Auto-Update Hook (PostToolUse)
 *
 * 触发条件：Write 或 Edit 工具写入 .cs 文件后
 * 行为：向上找最近的 .csproj 所在目录作为项目路径，后台异步触发 update.ps1 增量更新
 * 不阻塞主流程（fire-and-forget），失败静默处理
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 两个源码根（用于判断文件是否属于我们的项目）
const PROJECT_ROOTS = [
  'F:\\OTD Code WorkSpace',
  'F:\\Code WorkSpace',
];

const UPDATE_SCRIPT = 'C:\\Users\\admin\\.claude\\tools\\sqlite-index\\update.ps1';

function isUnderProjectRoot(filePath) {
  const normalized = filePath.replace(/\//g, '\\');
  return PROJECT_ROOTS.some(r => normalized.toLowerCase().startsWith(r.toLowerCase()));
}

// 向上查找最近的包含 .csproj 文件的目录
function findCsprojDir(filePath) {
  let dir = path.dirname(filePath.replace(/\//g, '\\'));
  const maxDepth = 10;
  for (let i = 0; i < maxDepth; i++) {
    try {
      const entries = fs.readdirSync(dir);
      if (entries.some(f => f.toLowerCase().endsWith('.csproj'))) {
        return dir;
      }
    } catch (e) { break; }
    const parent = path.dirname(dir);
    if (parent === dir) break; // 到达根目录
    dir = parent;
  }
  return null;
}

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理 Write / Edit
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    // 只处理 .cs 文件
    if (!/\.cs$/i.test(filePath)) return;

    // 只处理项目根内的文件
    if (!isUnderProjectRoot(filePath)) return;

    // 向上找最近的 .csproj 目录
    const projectDir = findCsprojDir(filePath);
    if (!projectDir) return;

    // 检查脚本存在
    if (!fs.existsSync(UPDATE_SCRIPT)) return;

    // 后台异步触发，不等待结果（fire-and-forget）
    const child = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NonInteractive',
      '-WindowStyle', 'Hidden',
      '-File', UPDATE_SCRIPT,
      '-ProjectPath', projectDir,
    ], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    // 仅输出提示到 stderr（展示给用户，不影响 hook 流程）
    const shortDir = path.basename(projectDir);
    process.stderr.write(`[SQLite Index] 已触发增量更新：${shortDir}\n`);

  } catch (e) {
    // 静默失败，不影响主流程
  }
});
