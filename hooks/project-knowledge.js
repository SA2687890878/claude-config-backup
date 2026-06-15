#!/usr/bin/env node
/**
 * SessionStart hook: 加载项目知识和经验
 *
 * 路径设计：
 * - 使用 Claude Code 的 projects 目录结构
 * - ~/.claude/projects/<project-path>/memory/learnings.md
 *
 * 符合 Claude 官方 hook 规范
 */
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
const PROJECTS_DIR = path.join(HOME, '.claude', 'projects');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

function getProjectDir(cwd) {
  let dir = cwd;
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(path.join(dir, '.git')) ||
          fs.existsSync(path.join(dir, '.sln')) ||
          fs.readdirSync(dir).some(f => f.toLowerCase().endsWith('.csproj'))) {
        const projectPath = dir.replace(/:/g, '-').replace(/[\/\\]/g, '-');
        return path.join(PROJECTS_DIR, projectPath);
      }
    } catch (e) {
      process.stderr.write('[project-knowledge] Access error: ' + dir + ' - ' + e.message + '\n');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function getRecentLearnings(filePath, maxLines = 30) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    // 找到 --- 分隔线的位置，跳过 header
    let startIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      if (lines[i].trim() === '---') {
        startIndex = i + 1;
        break;
      }
    }
    const relevantLines = lines.slice(startIndex);
    if (relevantLines.length === 0) return null;
    const recent = relevantLines.slice(-maxLines).join('\n').trim();
    return recent || null;
  } catch (e) {
    console.error('[project-knowledge] Error reading learnings:', e.message);
    return null;
  }
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const cwd = input.cwd || process.cwd();

    const sections = [];

    // 1. 加载项目级 learnings
    const projectDir = getProjectDir(cwd);
    if (projectDir) {
      const projectLearnings = path.join(projectDir, 'memory', 'learnings.md');
      const projectContent = getRecentLearnings(projectLearnings, 20);
      if (projectContent) {
        sections.push('## 项目经验');
        sections.push('');
        sections.push(projectContent);
      }
    }

    if (sections.length > 0) {
      sections.push('');
      sections.push('> 这些是之前会话发现的模式和经验，请参考避免重复踩坑。');
      console.log(JSON.stringify({ additionalContext: sections.join('\n') }));
    }

  } catch (e) { console.error('[project-knowledge] Error:', e.message); }
  process.exit(0);
})();
