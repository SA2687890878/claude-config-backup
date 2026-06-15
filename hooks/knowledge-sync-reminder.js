#!/usr/bin/env node
/**
 * SessionStart hook: Memory → Knowledge 同步提醒
 *
 * 触发条件：
 * - 每周一
 * - 或发现 5+ 条未同步的经验
 */
const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);

    const input = JSON.parse(raw);
    const cwd = input.cwd || process.cwd();

    // 计算项目名称
    const projectName = cwd.replace(/:/g, '-').replace(/[\/\\]/g, '-');
    const HOME = process.env.USERPROFILE || process.env.HOME || '';
    const learningsPath = path.join(HOME, '.claude', 'projects', projectName, 'memory', 'learnings.md');

    // 检查 learnings.md 是否存在
    if (!fs.existsSync(learningsPath)) {
      process.exit(0);
    }

    // 读取 learnings.md
    const learningsContent = fs.readFileSync(learningsPath, 'utf8');

    // 统计未同步的经验条目
    const unsyncedCount = countUnsyncedLearnings(learningsContent);

    // 判断是否需要提醒
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const shouldRemind = isMonday || unsyncedCount >= 5;

    if (shouldRemind && unsyncedCount > 0) {
      const message = isMonday
        ? `## 📚 知识同步提醒（每周检查）\n\n发现 **${unsyncedCount}** 条未同步的经验，建议运行 \`/sync-knowledge\` 将经验升级为可复用知识。`
        : `## 📚 知识同步提醒\n\n发现 **${unsyncedCount}** 条未同步的经验（超过 5 条阈值），建议运行 \`/sync-knowledge\` 避免经验积压。`;

      console.log(JSON.stringify({
        additionalContext: message
      }));
    }
  } catch (e) {
    console.error('[knowledge-sync-reminder] Error:', e.message);
  }
  process.exit(0);
}

/**
 * 统计未同步的经验条目数量
 */
function countUnsyncedLearnings(content) {
  let count = 0;

  // 匹配所有经验条目（## YYYY-MM-DD 开头的章节）
  const entryRegex = /## \d{4}-\d{2}-\d{2}.*?(?=## \d{4}-\d{2}-\d{2}|$)/gs;
  const entries = content.match(entryRegex) || [];

  for (const entry of entries) {
    // 提取"学到的模式"部分
    const patternsMatch = entry.match(/### 学到的模式(.*?)(?=###|$)/s);
    if (!patternsMatch) continue;

    const patternsSection = patternsMatch[1];
    const lines = patternsSection.split('\n').filter(line => line.trim().startsWith('-'));

    // 统计未标记"已同步"的行
    const unsyncedLines = lines.filter(line => !line.includes('**[已同步到'));
    count += unsyncedLines.length;
  }

  return count;
}

main();
