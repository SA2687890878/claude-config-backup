#!/usr/bin/env node
/**
 * PostToolUse hook: 在 Write|Edit 后记录修改
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

function getProjectInfo(filePath) {
  // 如果是相对路径，先转换为绝对路径
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  let dir = path.dirname(absPath);
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(path.join(dir, '.git')) ||
          fs.existsSync(path.join(dir, '.sln')) ||
          fs.readdirSync(dir).some(f => f.toLowerCase().endsWith('.csproj'))) {
        // 转换为 Claude Code 的 project 目录名
        const projectPath = dir.replace(/:/g, '-').replace(/[\/\\]/g, '-');
        return {
          projectDir: path.join(PROJECTS_DIR, projectPath),
          projectRoot: dir
        };
      }
    } catch (e) {
      process.stderr.write('[learning-recorder] Access error: ' + dir + ' - ' + e.message + '\n');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function ensureFile(filePath, header) {
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, header, 'utf8');
  }
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const toolName = input.tool_name || 'unknown';
    const toolInput = input.tool_input || {};

    if (toolName !== 'Write' && toolName !== 'Edit') {
      process.exit(0);
    }

    const filePath = toolInput.file_path || toolInput.filePath || '';
    if (!filePath) process.exit(0);

    // 只处理代码文件
    if (!filePath.match(/\.(cs|vue|js|ts|sql|csproj|json|md|ps1|html|css|xml|config|py|java|razor|sh|yml|yaml)$/i)) {
      process.exit(0);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // 找到项目信息
    const projectInfo = getProjectInfo(filePath);
    if (!projectInfo) process.exit(0);

    // 保留相对路径（相对于项目根目录）
    const relativePath = filePath.replace(projectInfo.projectRoot, '').replace(/^[/\\]/, '');

    // 构建条目
    const entry = `## ${dateStr}\n- 修改: \`${relativePath}\`\n\n`;

    if (projectInfo.projectDir) {
      // 写入项目级 learnings.md
      const projectLearnings = path.join(projectInfo.projectDir, 'memory', 'learnings.md');
      const header = '# 项目经验记录\n\n> 自动记录每次会话的修改，供后续会话参考。\n\n---\n\n';
      ensureFile(projectLearnings, header);

      // 检查是否重复（同一文件同一天不重复）
      const content = fs.readFileSync(projectLearnings, 'utf8');
      // 按日期段落检查：只在当天的记录中检查是否已存在
      const dayHeader = `## ${dateStr}`;
      const lastDayIndex = content.lastIndexOf(dayHeader);
      const daySection = lastDayIndex >= 0 ? content.substring(lastDayIndex) : '';
      if (!daySection.includes('`' + relativePath + '`')) {
        fs.appendFileSync(projectLearnings, entry, 'utf8');
      }
    }

  } catch (e) {
    console.error('[learning-recorder] Error:', e.message);
  }
  process.exit(0);
})();
