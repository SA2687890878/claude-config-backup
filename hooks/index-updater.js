#!/usr/bin/env node
/**
 * 索引更新器（PostToolUse）— 合并 sqlite-index-update + source-sync-update + learning-recorder
 * 写 .cs/.vue 文件后，一次性触发索引更新 + 源码同步 + 修改记录。
 * 不阻塞主流程（fire-and-forget），失败静默。
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
const PROJECT_ROOTS = ['F:\\OTD Code WorkSpace', 'F:\\Code WorkSpace'];
const UPDATE_SCRIPT = path.join(HOME, '.claude', 'tools', 'sqlite-index', 'update.ps1');
const CONVERT_SCRIPT = path.join(HOME, '.claude', 'skills', 'sync', 'scripts', 'convert-source.ps1');
const PROJECTS_DIR = path.join(HOME, '.claude', 'projects');

// 节流：同一项目 60 秒内不重复触发
const THROTTLE_MS = 60 * 1000;
const lastSyncMap = new Map();

function isUnderProjectRoot(fp) { return PROJECT_ROOTS.some(r => fp.replace(/\//g, '\\').toLowerCase().startsWith(r.toLowerCase())); }

function findCsprojDir(fp) {
  let dir = path.dirname(fp.replace(/\//g, '\\'));
  for (let i = 0; i < 10; i++) {
    try { if (fs.readdirSync(dir).some(f => f.toLowerCase().endsWith('.csproj'))) return dir; } catch (e) { break; }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function getProjectInfo(fp) {
  const absPath = path.isAbsolute(fp) ? fp : path.resolve(fp);
  let dir = path.dirname(absPath);
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.sln')) || fs.readdirSync(dir).some(f => f.toLowerCase().endsWith('.csproj'))) {
        return { projectDir: path.join(PROJECTS_DIR, dir.replace(/:/g, '-').replace(/[\/\\]/g, '-')), projectRoot: dir };
      }
    } catch (e) { break; }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function ensureDir(d) { try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} }

function recordModification(fp, projectInfo) {
  if (!projectInfo) return;
  if (!fp.match(/\.(cs|vue|js|ts|sql|csproj|json|md|ps1|html|css|xml|config)$/i)) return;
  const now = new Date().toISOString().split('T')[0];
  const relPath = fp.replace(projectInfo.projectRoot, '').replace(/^[/\\]/, '');
  const learningsPath = path.join(projectInfo.projectDir, 'memory', 'learnings.md');
  ensureDir(path.dirname(learningsPath));
  if (!fs.existsSync(learningsPath)) fs.writeFileSync(learningsPath, '# 项目经验记录\n\n---\n\n', 'utf8');
  const content = fs.readFileSync(learningsPath, 'utf8');
  const dayHeader = `## ${now}`;
  const lastDayIndex = content.lastIndexOf(dayHeader);
  const daySection = lastDayIndex >= 0 ? content.substring(lastDayIndex) : '';
  if (!daySection.includes('`' + relPath + '`')) {
    try { fs.appendFileSync(learningsPath, `## ${now}\n- 修改: \`${relPath}\`\n\n`, 'utf8'); } catch (e) {}
  }
}

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!filePath) return;
    const isCs = /\.cs$/i.test(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 1. 记录修改到 learnings.md
    const pInfo = getProjectInfo(filePath);
    recordModification(filePath, pInfo);

    // 2. 加密项目：触发 SQLite 索引更新 + 源码同步
    if (isCs && isUnderProjectRoot(filePath)) {
      const projDir = findCsprojDir(filePath);
      if (projDir) {
        const now = Date.now();
        const last = lastSyncMap.get(projDir) || 0;
        if (now - last >= THROTTLE_MS) {
          lastSyncMap.set(projDir, now);
          // SQLite 索引
          if (fs.existsSync(UPDATE_SCRIPT)) {
            const child = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NonInteractive', '-WindowStyle', 'Hidden', '-File', UPDATE_SCRIPT, '-ProjectPath', projDir], { detached: true, stdio: 'ignore' });
            child.unref();
          }
          // 源码同步
          if (fs.existsSync(CONVERT_SCRIPT)) {
            const child2 = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NonInteractive', '-WindowStyle', 'Hidden', '-File', CONVERT_SCRIPT, '-ProjectPath', projDir], { detached: true, stdio: 'ignore' });
            child2.unref();
            const shortDir = path.basename(projDir);
            process.stderr.write(`[index-updater] 已触发索引+同步：${shortDir}\n`);
          }
        }
      }
    }

    // 3. 非加密项目: 只记录修改（已在上方 recordModification 处理）
  } catch (e) { console.error('[index-updater] Error:', e.message); }
});