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
const METRICS_DIR = path.join(HOME, '.claude', 'metrics', 'daily');

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

function readActiveTask() {
  const activePath = path.join(HOME, '.claude', 'tasks', 'active.json');
  try {
    if (!fs.existsSync(activePath)) return null;
    const data = JSON.parse(fs.readFileSync(activePath, 'utf8'));
    const tasks = Array.isArray(data.active) ? data.active : [];
    return tasks.find(task => task && task.task_id) || null;
  } catch (_) { return null; }
}

function getMetricsSuggestions() {
  try {
    if (!fs.existsSync(METRICS_DIR)) return [];
    const files = fs.readdirSync(METRICS_DIR).filter(f => f.endsWith('.json')).sort().reverse();
    if (files.length < 3) return [];
    const recentFiles = files.slice(0, 7);
    const aggregated = {};
    let totalCalls = 0;
    for (const file of recentFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(METRICS_DIR, file), 'utf8'));
        totalCalls += data.trackedCalls || 0;
        for (const [tool, stats] of Object.entries(data.tools || {})) {
          if (!aggregated[tool]) aggregated[tool] = 0;
          aggregated[tool] += stats.count || 0;
        }
      } catch (_) {}
    }
    const suggestions = [];
    const sorted = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [topTool, topCount] = sorted[0];
      const avgPerDay = Math.round(topCount / recentFiles.length);
      if (topTool === 'Edit' && avgPerDay > 30) suggestions.push(`Edit 调用频率高（日均 ${avgPerDay} 次）。考虑：是否在反复修改同一文件？`);
      if (topTool === 'Agent' && avgPerDay > 10) suggestions.push(`Agent 调用频率高（日均 ${avgPerDay} 次）。参考 workflow-agent-usage-principles。`);
      if (topTool === 'WebSearch' && avgPerDay > 5) suggestions.push(`WebSearch 调用频率高（日均 ${avgPerDay} 次）。考虑用 ctx_index 持久化。`);
    }
    const hasReview = aggregated['review'] || 0;
    const hasEdit = aggregated['Edit'] || 0;
    if (hasEdit > 50 && hasReview === 0) suggestions.push('过去一周有大量代码修改但没有运行 /review。建议定期审查。');
    const avgDaily = Math.round(totalCalls / recentFiles.length);
    if (avgDaily > 100) suggestions.push(`日均追踪调用 ${avgDaily} 次，token 消耗较高。`);
    return suggestions;
  } catch (_) { return []; }
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

    // === 3. 项目初始化检测 ===
    const projectName = cwd.replace(/:/g, '-').replace(/[\/\\]/g, '-');
    const hasClaudeDir = fs.existsSync(path.join(cwd, '.claude'));
    const hasArtifactsDir = fs.existsSync(path.join(cwd, '.claude', 'artifacts'));
    const hasProjectMemory = fs.existsSync(path.join(HOME, '.claude', 'projects', projectName, 'memory'));

    if (isGitRepo && (!hasClaudeDir || !hasArtifactsDir || !hasProjectMemory)) {
      sections.push('');
      sections.push('## ⚠️ 项目未完全初始化');
      const missing = [];
      if (!hasClaudeDir) missing.push('`.claude/` 目录');
      if (!hasArtifactsDir) missing.push('`.claude/artifacts/` 目录');
      if (!hasProjectMemory) missing.push('Memory 目录');
      sections.push(`- 缺失：${missing.join('、')}`);
      sections.push('- 建议：运行项目启动 Checklist 完成初始化');
      sections.push('  ```bash');
      sections.push('  cat ~/.claude/docs/PROJECT-INIT-CHECKLIST.md');
      sections.push('  ```');
    }

    // === 4. 当前任务恢复（唯一真源：active.json） ===
    const activeTask = readActiveTask();
    if (activeTask) {
      sections.push('');
      sections.push('## ⏳ 当前任务');
      sections.push(`- 任务：${activeTask.title || activeTask.task_id}`);
      sections.push(`- 阶段：${activeTask.stage || '(未设置)'}`);
      sections.push(`- 产物：${activeTask.product_path || '(未设置)'}`);
      if (activeTask.paused_at) sections.push(`- 断点：${activeTask.paused_at}`);
      sections.push('> 需要恢复时读取 active.json 与对应 product_path，不读取旧 task-state.md。');
    }

    // === 5. 周度度量优化建议 ===
    const suggestions = getMetricsSuggestions();
    if (suggestions.length > 0) {
      sections.push('');
      sections.push('## 📈 度量优化建议');
      sections.push('> 基于最近 7 天的使用数据');
      for (const s of suggestions) {
        sections.push('- ' + s);
      }
    }

    if (sections.length > 0) {
      console.log(JSON.stringify({ additionalContext: sections.join('\n') }));
    }
  } catch (e) {
    console.error('[session-start] Error:', e.message);
  }
  process.exit(0);
})();
