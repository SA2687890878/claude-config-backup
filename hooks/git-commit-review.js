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

// ============================================================
// Git 命令安全检查
// ============================================================

const GIT_SECURITY_CHECKS = [
  { pattern: /git\s+push\s+.*--force/, label: 'Force push detected', severity: 'HIGH', confidence: 95, description: '强制推送可能覆盖其他人的代码', fix: '使用 --force-with-lease 或确认分支是独占的' },
  { pattern: /git\s+push\s+.*--force-with-lease/, label: 'Force push with lease', severity: 'MEDIUM', confidence: 70, description: '使用 --force-with-lease 比 --force 安全', fix: '确认分支是独占的' },
  { pattern: /git\s+push\s+.*origin\s+(main|master|develop)/, label: 'Push to protected branch', severity: 'HIGH', confidence: 90, description: '推送到受保护的分支', fix: '使用 Pull Request 流程' },
  { pattern: /git\s+commit\s+.*-m\s*["'].*(?:password|secret|token|key|credential)/i, label: 'Secret in commit message', severity: 'HIGH', confidence: 85, description: '提交信息中包含敏感词', fix: '不要在提交信息中包含敏感信息' },
  { pattern: /git\s+commit\s+.*--no-verify/, label: 'Skip commit hooks', severity: 'MEDIUM', confidence: 60, description: '跳过提交钩子', fix: '确保所有钩子都通过' },
  { pattern: /git\s+reset\s+.*--hard/, label: 'Hard reset detected', severity: 'HIGH', confidence: 90, description: '硬重置会丢失未提交的更改', fix: '确认没有未提交的更改' },
  { pattern: /git\s+clean\s+.*-f/, label: 'Force clean detected', severity: 'HIGH', confidence: 85, description: '强制清理会删除未跟踪的文件', fix: '确认没有重要的未跟踪文件' },
];

// ============================================================
// 置信度评分
// ============================================================

function calculateConfidence(match, pattern, context) {
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

    for (const pattern of GIT_SECURITY_CHECKS) {
      const match = command.match(pattern.pattern);
      if (match) {
        const confidence = calculateConfidence(match[0], pattern, {});
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

      // 对于高严重性问题，输出警告但不阻塞
      const highSeverity = findings.filter(f => f.severity === 'HIGH');
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
