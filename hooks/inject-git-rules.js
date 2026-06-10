#!/usr/bin/env node
/**
 * UserPromptSubmit hook: 检测 git 相关操作，注入 git.md 规则
 * 触发条件：用户输入包含 git 命令或中文关键词
 */
const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    // 超时保护
    setTimeout(() => resolve(''), 1000);
  });
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw) { process.exit(0); return; }

    const input = JSON.parse(raw);
    const prompt = input.prompt || '';

    // 匹配 git 命令或中文关键词
    if (/git\s+(commit|push|branch|merge|rebase|checkout|stash|reset|cherry-pick|revert)/i.test(prompt) ||
        /提交|推送|分支|合并|变基|暂存|回滚/i.test(prompt)) {

      const gitRulesPath = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'hooks', 'rules', 'git.md');

      if (fs.existsSync(gitRulesPath)) {
        const gitRules = fs.readFileSync(gitRulesPath, 'utf8');
        console.log(JSON.stringify({ additionalContext: gitRules }));
      }
    }
  } catch (e) {
    // 静默失败
  }
  process.exit(0);
}

main();
