#!/usr/bin/env node
/**
 * UserPromptSubmit hook: 检测代码分析操作，注入 token-optimization.md 规则
 * 触发条件：用户输入涉及 codegraph、sqlite 索引、代码分析
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
    if (!raw) { process.exit(0); return; }

    const input = JSON.parse(raw);
    const prompt = input.prompt || '';

    // 匹配代码分析相关关键词（避免"优化"等日常词汇误触发）
    if (/codegraph|search\.ps1|sqlite[-_]?index|代码索引|token.{0,3}优化|rtk\s+(gain|proxy|discover)/i.test(prompt)) {

      const tokenRulesPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'rules', 'tools', 'token-optimization.md');

      if (fs.existsSync(tokenRulesPath)) {
        const tokenRules = fs.readFileSync(tokenRulesPath, 'utf8');
        // 只注入前 40 行（核心规则），避免浪费 token
        const lines = tokenRules.split('\n').slice(0, 40).join('\n');
        console.log(JSON.stringify({ additionalContext: lines }));
      }
    }
  } catch (e) {
    console.error('[inject-token-rules] Error:', e.message);
  }
  process.exit(0);
}

main();
