#!/usr/bin/env node
/**
 * Review Trigger Hook (PostToolUse)
 * 修改 .cs/.vue/.sql/.json 文件后，自动提醒运行 /adversarial-review 进行代码审查
 *
 * Stdin:  JSON { tool_name, tool_input }
 * stderr: User-facing reminders
 */
const path = require('path');

// 需要审查的文件扩展名
const REVIEW_EXTENSIONS = /\.(cs|vue|sql|env)$/i;

// 需要审查的配置文件
const CONFIG_FILES = /appsettings.*\.json$/i;

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const tool = input.tool_name || '';
    if (tool !== 'Write' && tool !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!filePath) return;

    const fileName = path.basename(filePath);

    // 测试文件不提醒
    if (/[\\/](Tests?|Test)[\\/]/i.test(filePath)) return;

    // .cs/.vue/.sql/.env 文件提醒
    if (REVIEW_EXTENSIONS.test(filePath)) {
      console.error(`\n[Review Trigger] 已修改 ${fileName}，建议运行 \`/adversarial-review\` 进行代码审查。`);
      return;
    }

    // 配置文件提醒
    if (CONFIG_FILES.test(filePath)) {
      console.error(`\n[Review Trigger] 已修改配置文件 ${fileName}，建议运行 \`/adversarial-review\` 进行安全审查。`);
      return;
    }
  } catch (e) { console.error('[review-trigger] Error:', e.message); }
});
