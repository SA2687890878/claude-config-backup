#!/usr/bin/env node
/**
 * Git Commit/Push Review Hook (PostToolUse)
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入
 * - stdout: 成功时输出原始 JSON
 * - stderr: 警告时输出警告信息
 * - exit code: 0=成功，2=阻塞
 */

const fs = require('fs');
const path = require('path');
const { getGitSecurityPatterns } = require('./shared-utils');

// ============================================================
// Git 命令安全检查
// ============================================================

// Use shared git security patterns
const GIT_SECURITY_CHECKS = getGitSecurityPatterns();

// ============================================================
// 置信度评分
// ============================================================

function calculateConfidence(pattern, context) {
  let confidence = pattern.confidence || 70;
  if (context.branch && /test|dev|feature/.test(context.branch)) confidence -= 10;
  return Math.max(0, Math.min(100, confidence));
}

// ============================================================
// 主逻辑
// ============================================================

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理 Bash 命令
    if (toolName !== 'Bash') {
      process.stdout.write(data);
      return;
    }

    const command = (input.tool_input && input.tool_input.command) || '';

    // 只处理 git commit 和 git push
    if (!command.match(/git\s+(?:commit|push|reset|clean)/)) {
      process.stdout.write(data);
      return;
    }

    const findings = [];

    // 获取当前分支用于置信度计算
    let currentBranch = '';
    try {
      const cwd = input.cwd || process.cwd();
      currentBranch = require('child_process').execSync('git rev-parse --abbrev-ref HEAD', {
        cwd, encoding: 'utf8', timeout: 3000
      }).trim();
    } catch (e) { process.stderr.write('[git-commit-review] Cannot get branch: ' + e.message + '\n'); }

    for (const pattern of GIT_SECURITY_CHECKS) {
      const match = command.match(pattern.pattern);
      if (match) {
        const confidence = calculateConfidence(pattern, { branch: currentBranch });
        if (confidence >= 60) {
          findings.push({
            label: pattern.label,
            matched: match[0].substring(0, 60),
            severity: pattern.severity,
            confidence: confidence,
            description: pattern.description,
            fix: pattern.fix
          });
        }
      }
    }

    if (findings.length > 0) {
      // 输出到 stderr（会反馈给 Claude）
      process.stderr.write('[Hook] WARNING: Git security check\n');
      findings.forEach(f => {
        process.stderr.write(`[Hook]   - [${f.severity}] ${f.label} (置信度: ${f.confidence}%)\n`);
        process.stderr.write(`[Hook]     匹配: "${f.matched}..."\n`);
        process.stderr.write(`[Hook]     说明: ${f.description}\n`);
        process.stderr.write(`[Hook]     建议: ${f.fix}\n`);
      });

      // CRITICAL: force push 和 push to main/master 必须拦截
      const blockPatterns = ['Force push detected', 'Push to protected branch'];
      const blockFindings = findings.filter(f => blockPatterns.includes(f.label));
      if (blockFindings.length > 0) {
        const reasons = blockFindings.map(f => f.description).join('; ');
        console.log(JSON.stringify({
          decision: 'block',
          reason: `[git-commit-review] ${reasons}。请使用 Pull Request 流程。`
        }));
        process.exit(0);
      }

      // 其他 HIGH 级别问题仅警告
      const highSeverity = findings.filter(f => f.severity === 'HIGH' && !blockPatterns.includes(f.label));
      if (highSeverity.length > 0) {
        process.stderr.write('[Hook] ⚠️ 请确认以上安全问题\n');
      }
    }

    // 始终输出原始 JSON 到 stdout
    process.stdout.write(data);
  } catch (e) {
    process.stderr.write("[Hook Error] git-commit-review: " + e.message + "\n");
    process.stdout.write(data);
  }
});
