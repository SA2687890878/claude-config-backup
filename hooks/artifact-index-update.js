#!/usr/bin/env node
/**
 * PostToolUse hook: Artifact 索引自动更新
 *
 * 监听 Write 到 .claude/artifacts/ 的文件，自动更新 INDEX.md
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
    const tool = input.tool;
    const params = input.params || {};

    // 只监听 Write 工具
    if (tool !== 'Write') process.exit(0);

    const filePath = params.file_path || '';
    const normalized = filePath.replace(/\\/g, '/');

    // 只处理 .claude/artifacts/ 目录下的文件
    if (!normalized.includes('.claude/artifacts/')) process.exit(0);

    // 跳过 INDEX.md 自身和 archive/ 目录
    if (normalized.endsWith('INDEX.md') || normalized.includes('/archive/')) process.exit(0);

    const cwd = input.cwd || process.cwd();
    const indexPath = path.join(cwd, '.claude', 'artifacts', 'INDEX.md');

    // 读取或创建 INDEX.md
    let indexContent = '';
    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, 'utf8');
    } else {
      indexContent = `# Artifacts 索引

> 自动生成的产物索引，按类型分组。

## 需求文档

## 架构设计

## 详细设计

## RCA 根因分析

## 决策记录
`;
    }

    // 解析文件名，提取类型和信息
    const fileName = path.basename(filePath);
    const match = fileName.match(/^(Requirement|Architecture|Design|RCA|Decision)-(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    if (!match) process.exit(0);

    const [, type, date, slug] = match;
    const displayName = slug.replace(/-/g, ' ');

    // 映射类型到中文标题
    const typeMap = {
      'Requirement': '需求文档',
      'Architecture': '架构设计',
      'Design': '详细设计',
      'RCA': 'RCA 根因分析',
      'Decision': '决策记录'
    };

    const sectionTitle = typeMap[type];
    if (!sectionTitle) process.exit(0);

    // 检查是否已存在此条目
    const entryLine = `- [${date} ${displayName}](${fileName})`;
    if (indexContent.includes(entryLine)) {
      // 已存在，不重复添加
      process.exit(0);
    }

    // 插入到对应的章节
    const sectionRegex = new RegExp(`^## ${sectionTitle}$`, 'm');
    const sectionMatch = indexContent.match(sectionRegex);

    if (sectionMatch) {
      const sectionIndex = sectionMatch.index + sectionMatch[0].length;
      // 找到下一个 ## 章节的位置
      const nextSectionIndex = indexContent.indexOf('\n##', sectionIndex);
      const insertPosition = nextSectionIndex === -1 ? indexContent.length : nextSectionIndex;

      // 插入新条目
      const before = indexContent.substring(0, insertPosition);
      const after = indexContent.substring(insertPosition);
      indexContent = before + `\n${entryLine}` + after;

      // 写回 INDEX.md
      fs.writeFileSync(indexPath, indexContent, 'utf8');

      console.log(JSON.stringify({
        message: `✅ Artifact 索引已更新：${fileName}`
      }));
    }
  } catch (e) {
    console.error('[artifact-index-update] Error:', e.message);
  }
  process.exit(0);
}

main();
