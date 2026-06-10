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

const HOME = process.env.USERPROFILE || process.env.HOME;

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
    if (normalized.toLowerCase().startsWith(p.root.toLowerCase())) {
      return p;
    }
  }
  return null;
}

function readTaskState() {
  const taskStatePath = path.join(HOME, '.claude', 'projects', 'C--Users-admin', 'memory', 'task-state.md');
  try {
    if (fs.existsSync(taskStatePath)) {
      return fs.readFileSync(taskStatePath, 'utf8');
    }
  } catch (_) {}
  return null;
}

let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cwd = input.cwd || process.cwd();
    const opts = { cwd, encoding: 'utf8', timeout: 3000, windowsHide: true };

    const sections = [];

    // === 1. Git 状态 ===
    let branch = '';
    let dirty = '';
    let lastCommit = '';
    try { branch = execSync('git rev-parse --abbrev-ref HEAD', opts).trim(); } catch (_) {
      // 非 git 仓库，只输出项目检测结果
      const project = detectProject(cwd);
      if (project) {
        sections.push(`## 当前项目`);
        sections.push(`- 项目：${project.name}`);
        sections.push(`- 技术栈：${project.stack}`);
        sections.push(`- 数据库：${project.db}`);
      }
      if (sections.length > 0) {
        console.log(JSON.stringify({ additionalContext: sections.join('\n') }));
      }
      return;
    }
    try { dirty = execSync('git status --porcelain', opts).trim(); } catch (_) {}
    try { lastCommit = execSync('git log -1 --oneline', opts).trim(); } catch (_) {}

    const dirtyCount = dirty ? dirty.split('\n').length : 0;
    sections.push(`## 项目状态`);
    sections.push(`- 分支：${branch}`);
    sections.push(`- 上次提交：${lastCommit || '(无)'}`);
    sections.push(`- 未提交改动：${dirtyCount} 个文件`);
    if (dirtyCount > 0 && dirtyCount <= 20) {
      sections.push('', '```', dirty, '```');
    } else if (dirtyCount > 20) {
      sections.push(`  （改动较多，运行 \`git status\` 查看完整列表）`);
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
    const taskState = readTaskState();
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
  } catch (_) {}
});
