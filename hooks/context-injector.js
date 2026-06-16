#!/usr/bin/env node
/**
 * UserPromptSubmit hook: 智能注入规则上下文
 *
 * 根据输入关键词，自动注入对应的规则文件
 * 合并了原先的：inject-git-rules.js、inject-token-rules.js、prompt-optimizer.js
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
    const prompt = input.prompt || '';

    // 规则配置：关键词 → 文件路径 + 最大行数
    const rules = [
      {
        name: 'Git',
        keywords: /git\s+(commit|push|branch|merge|rebase|checkout|stash|reset|cherry-pick|revert)|提交|推送|分支|合并|变基|暂存|回滚/i,
        path: 'workflows/git.md',
        maxLines: 40
      },
      {
        name: 'Token Optimization',
        keywords: /codegraph|search\.ps1|sqlite[-_]?index|代码索引|token.{0,3}优化|rtk\s+(gain|proxy|discover)/i,
        path: 'tools/token-optimization.md',
        maxLines: 40
      },
      {
        name: 'Security',
        keywords: /密钥|password|api[-_]?key|secret|credential|token|安全|防护/i,
        path: 'tools/security.md',
        maxLines: 30
      }
    ];

    // 找到匹配的规则
    const matched = rules.filter(r => r.keywords.test(prompt));
    if (matched.length === 0) process.exit(0);

    const rulesDir = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'knowledge', 'rules');
    const contexts = [];

    for (const rule of matched) {
      const rulePath = path.join(rulesDir, rule.path);

      if (fs.existsSync(rulePath)) {
        try {
          const content = fs.readFileSync(rulePath, 'utf8');
          const lines = content.split('\n').slice(0, rule.maxLines).join('\n');
          contexts.push(`## ${rule.name}\n\n${lines}`);
        } catch (e) {
          console.error(`[context-injector] Failed to read ${rule.path}:`, e.message);
        }
      }
    }

    if (contexts.length > 0) {
      console.log(JSON.stringify({
        additionalContext: contexts.join('\n\n---\n\n')
      }));
    }
  } catch (e) {
    console.error('[context-injector] Error:', e.message);
  }
  process.exit(0);
}

main();
