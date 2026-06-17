#!/usr/bin/env node
/**
 * Source Sync Auto-Update Hook (PostToolUse)
 *
 * 触发条件：Write 或 Edit 工具写入 .cs/.vue 文件后
 * 行为：转换加密源码为可读副本 → 用 context-mode 建全文索引
 * 不阻塞主流程（fire-and-forget），失败静默处理
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 项目源码根目录
const PROJECT_ROOTS = [
  'F:\\OTD Code WorkSpace',
  'F:\\Code WorkSpace',
];

const CONVERT_SCRIPT = 'C:\\Users\\admin\\.claude\\skills\\sync-source-index\\scripts\\convert-source.ps1';
const TEMP_BASE = path.join(process.env.TEMP || process.env.USERPROFILE || '', 'claude-source-sync');

// 文件扩展名 → 转换参数
const EXT_MAP = {
  '.cs': '*.cs',
  '.vue': '*.vue',
  '.js': '*.js',
  '.ts': '*.ts',
};

function isUnderProjectRoot(filePath) {
  const normalized = filePath.replace(/\//g, '\\');
  return PROJECT_ROOTS.some(r => normalized.toLowerCase().startsWith(r.toLowerCase()));
}

// 向上查找最近的包含 .sln 或 .csproj 的目录作为项目根
function findProjectRoot(filePath) {
  let dir = path.dirname(filePath.replace(/\//g, '\\'));
  const maxDepth = 10;
  for (let i = 0; i < maxDepth; i++) {
    try {
      const entries = fs.readdirSync(dir);
      const hasProjectFile = entries.some(f => {
        const lower = f.toLowerCase();
        return lower.endsWith('.csproj') || lower.endsWith('.sln') ||
               (lower === 'package.json' && entries.some(e => e === 'src'));
      });
      if (hasProjectFile) return dir;
    } catch (e) { break; }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// 获取项目名（目录名，. → -）
function getProjectName(projectDir) {
  return path.basename(projectDir).replace(/\./g, '-');
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
    if (!filePath) return;

    // 只处理支持的文件类型
    const ext = path.extname(filePath).toLowerCase();
    if (!EXT_MAP[ext]) return;

    // 只处理项目根内的文件
    if (!isUnderProjectRoot(filePath)) return;

    // 找项目根
    const projectDir = findProjectRoot(filePath);
    if (!projectDir) return;

    // 检查转换脚本
    if (!fs.existsSync(CONVERT_SCRIPT)) return;

    const projectName = getProjectName(projectDir);
    const srcDir = path.join(projectDir, 'src');
    const dstDir = path.join(TEMP_BASE, projectName + '-decoded');
    const extArg = EXT_MAP[ext];

    // 确保 src 目录存在（Vue 项目可能在根目录）
    const actualSrcDir = fs.existsSync(srcDir) ? srcDir : projectDir;

    // 后台执行：转换 → 索引
    const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
# 1. 转换源码
& "${CONVERT_SCRIPT}" -SrcDir "${actualSrcDir}" -DstDir "${dstDir}" -Extensions "${extArg}"
# 2. 重建索引
context-mode index "${dstDir}" --source "${projectName}-src" --project "${dstDir}" --max-files 500 --ext "${extArg.replace(/\*/g, '')}"
`;

    const child = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NonInteractive',
      '-WindowStyle', 'Hidden',
      '-Command', psScript,
    ], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    const shortName = path.basename(projectDir);
    process.stderr.write(`[Source Sync] 已触发同步：${shortName} → context-mode 索引\n`);

  } catch (e) {
    console.error('[source-sync-update] Error:', e.message);
  }
});
