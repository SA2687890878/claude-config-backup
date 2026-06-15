#!/usr/bin/env node
/**
 * SessionStart hook: 会话启动时自动注入上下文
 *
 * 功能：
 * 1. Git 状态摘要（分支、上次提交、未提交改动）
 * 2. 任务进度恢复（检查 memory/task-state.md）
 * 3. 项目检测（识别当前目录所属项目，注入技术栈提示）
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';

// 已知项目根目录 → 项目信息（按优先级排序，先匹配先生效）
const KNOWN_PROJECTS = [
  {
    root: 'F:\\OTD Code WorkSpace',
    name: 'OTD',
    db: 'PostgreSQL',
    stack: '.NET 8.0 + Vue 2 + PostgreSQL',
    rules: 'postgresql.md',
  },
  {
    root: 'F:\\Code WorkSpace',
    name: '旧项目',
    db: 'SQL Server',
    stack: '.NET 8.0 / .NET Framework 4.5.2 + Vue 2 + SQL Server',
    rules: 'sqlserver.md',
  },
];

function detectProject(cwd) {
  const normalized = cwd.replace(/\//g, '\\');
  for (const p of KNOWN_PROJECTS) {
    // 精确匹配：确保路径分隔符正确，避免误判（如 F:\OTD-Backup 匹配 F:\OTD）
    if (normalized.toLowerCase().startsWith(p.root.toLowerCase() + '\\') ||
        normalized.toLowerCase() === p.root.toLowerCase()) {
      return p;
    }
  }
  return null;
}

function readTaskState(cwd) {
  // 从 cwd 动态生成项目目录名
  const projectPath = cwd.replace(/:/g, '-').replace(/[\/\\]/g, '-');
  const taskStatePath = path.join(HOME, '.claude', 'projects', projectPath, 'memory', 'task-state.md');
  try {
    if (fs.existsSync(taskStatePath)) {
      return fs.readFileSync(taskStatePath, 'utf8');
    }
  } catch (_) {}
  return null;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const cwd = input.cwd || process.cwd();
    const opts = { cwd, encoding: 'utf8', timeout: 3000, windowsHide: true };

    const sections = [];

    // === 1. Git 状态 ===
    let branch = '';
    let dirty = '';
    let lastCommit = '';
    let isGitRepo = true;
    try { branch = execSync('git rev-parse --abbrev-ref HEAD', opts).trim(); } catch (_) {
      isGitRepo = false;
    }
    try { dirty = execSync('git status --porcelain', opts).trim(); } catch (_) {}
    try { lastCommit = execSync('git log -1 --oneline', opts).trim(); } catch (_) {}

    // 只在 git 仓库中输出 Git 状态
    if (isGitRepo) {
      const dirtyCount = dirty ? dirty.split('\n').filter(l => l.trim()).length : 0;
      sections.push(`## 项目状态`);
      sections.push(`- 分支：${branch}`);
      sections.push(`- 上次提交：${lastCommit || '(无)'}`);
      sections.push(`- 未提交改动：${dirtyCount} 个文件`);
      if (dirtyCount > 0 && dirtyCount <= 20) {
        sections.push('', '```', dirty, '```');
      } else if (dirtyCount > 20) {
        sections.push(`  （改动较多，运行 \`git status\` 查看完整列表）`);
      }
    }

    // === 2. 项目检测 ===
    const project = detectProject(cwd);
    if (project) {
      sections.push('');
      sections.push(`## 当前项目`);
      sections.push(`- 项目：${project.name}`);
      sections.push(`- 技术栈：${project.stack}`);
      sections.push(`- 数据库：${project.db}`);
    }

    // === 3. 任务进度恢复 ===
    const taskState = readTaskState(cwd);
    if (taskState && taskState.includes('- [ ]')) {
      // 有未完成的任务
      sections.push('');
      sections.push('## ⏳ 上次未完成的任务');
      sections.push('');
      sections.push(taskState);
      sections.push('');
      sections.push('> 检测到未完成任务。用户说"继续工作"时，请读取上述进度并恢复。');
    }

    if (sections.length > 0) {
      console.log(JSON.stringify({ additionalContext: sections.join('\n') }));
    }
  } catch (e) {
    console.error('[session-start] Error:', e.message);
  }
  process.exit(0);
})();
