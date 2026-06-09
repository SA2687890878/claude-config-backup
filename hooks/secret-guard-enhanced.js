#!/usr/bin/env node
/**
 * Enhanced Secret Guard Hook (PreToolUse)
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入
 * - stdout: 成功时输出原始 JSON（显示在 transcript）
 * - stderr: 错误时输出错误信息（反馈给 Claude）
 * - exit code: 0=成功，2=阻塞
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 内置安全规则
// ============================================================

const SECRET_PATTERNS = [
  { pattern: /Password\s*=\s*[^;{}\s$"']+/i, label: 'Connection string password', severity: 'HIGH', confidence: 90, description: '数据库连接字符串中的明文密码', fix: '使用环境变量或 secrets manager' },
  { pattern: /Server\s*=\s*[^;]+;.*Password\s*=\s*[^;]+/i, label: 'DB connection string', severity: 'HIGH', confidence: 95, description: '完整的数据库连接字符串，包含密码', fix: '使用环境变量存储连接字符串' },
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"'${]{8,}["']/i, label: 'Hardcoded API key', severity: 'HIGH', confidence: 85, description: '硬编码的 API 密钥', fix: '使用环境变量 API_KEY' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]{20,}/i, label: 'Hardcoded Bearer token', severity: 'HIGH', confidence: 90, description: '硬编码的 Bearer token', fix: '使用环境变量或 OAuth 流程' },
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, label: 'Private key', severity: 'CRITICAL', confidence: 100, description: '私钥文件内容', fix: '绝对不要在代码中包含私钥，使用密钥管理服务' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key', severity: 'CRITICAL', confidence: 100, description: 'AWS 访问密钥', fix: '使用 IAM 角色或环境变量' },
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'${]{4,}["']/i, label: 'Hardcoded password', severity: 'HIGH', confidence: 80, description: '硬编码的密码', fix: '使用环境变量或 secrets manager' },
  { pattern: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub personal access token', severity: 'HIGH', confidence: 100, description: 'GitHub 个人访问令牌', fix: '使用 GitHub CLI 或环境变量' },
  { pattern: /gho_[A-Za-z0-9]{36}/, label: 'GitHub OAuth token', severity: 'HIGH', confidence: 100, description: 'GitHub OAuth 令牌', fix: '使用 GitHub CLI 或环境变量' },
  { pattern: /github_pat_[A-Za-z0-9_]{22,}/, label: 'GitHub fine-grained PAT', severity: 'HIGH', confidence: 100, description: 'GitHub 细粒度个人访问令牌', fix: '使用 GitHub CLI 或环境变量' },
  { pattern: /glpat-[A-Za-z0-9\-_]{20,}/, label: 'GitLab personal access token', severity: 'HIGH', confidence: 100, description: 'GitLab 个人访问令牌', fix: '使用环境变量' },
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/, label: 'Anthropic API key', severity: 'HIGH', confidence: 100, description: 'Anthropic API 密钥', fix: '使用环境变量 ANTHROPIC_API_KEY' },
  { pattern: /\bsk-[A-Za-z0-9]{32,}/, label: 'OpenAI-style API key', severity: 'HIGH', confidence: 85, description: 'OpenAI 风格的 API 密钥', fix: '使用环境变量 OPENAI_API_KEY' },
  { pattern: /ANTHROPIC_(?:AUTH_TOKEN|API_KEY)\s*[:=]\s*["']?[A-Za-z0-9\-_]{16,}/i, label: 'Anthropic credential assignment', severity: 'HIGH', confidence: 95, description: 'Anthropic 凭证赋值', fix: '使用环境变量，不要在代码中赋值' },
  { pattern: /eval\s*\(/, label: 'eval() injection', severity: 'HIGH', confidence: 70, description: 'eval() 执行任意代码，可能导致代码注入', fix: '使用 JSON.parse() 或安全的表达式解析器' },
  { pattern: /os\.system\s*\(/, label: 'os.system injection', severity: 'HIGH', confidence: 80, description: 'os.system() 通过 shell 执行命令，可能导致命令注入', fix: '使用 subprocess.run() 配合参数列表' },
  { pattern: /subprocess\.(?:call|run|Popen)\s*\([^)]*shell\s*=\s*True/, label: 'subprocess shell injection', severity: 'HIGH', confidence: 85, description: 'subprocess 使用 shell=True 可能导致命令注入', fix: '使用 shell=False 并传递参数列表' },
  { pattern: /child_process\.exec\s*\(/, label: 'child_process.exec injection', severity: 'HIGH', confidence: 80, description: 'child_process.exec() 通过 shell 执行命令', fix: '使用 execFile() 或 spawn() 配合参数数组' },
  { pattern: /yaml\.load\s*\(/, label: 'unsafe yaml.load', severity: 'MEDIUM', confidence: 90, description: 'yaml.load() 可能执行任意 Python 代码', fix: '使用 yaml.safe_load()' },
  { pattern: /pickle\.load\s*\(/, label: 'pickle deserialization', severity: 'HIGH', confidence: 90, description: 'pickle.load() 可能执行任意代码', fix: '使用 JSON 或安全的反序列化器' },
  { pattern: /innerHTML\s*=/, label: 'innerHTML XSS', severity: 'MEDIUM', confidence: 75, description: 'innerHTML 赋值可能导致 XSS', fix: '使用 DOMPurify 清理或 textContent' },
  { pattern: /document\.write\s*\(/, label: 'document.write XSS', severity: 'MEDIUM', confidence: 80, description: 'document.write() 可能导致 XSS', fix: '使用 DOM 操作方法' },
  { pattern: /dangerouslySetInnerHTML/, label: 'React dangerouslySetInnerHTML', severity: 'MEDIUM', confidence: 85, description: 'dangerouslySetInnerHTML 可能导致 XSS', fix: '使用 DOMPurify 清理内容' },
];

const BASH_SECRET_PATTERNS = [
  { pattern: /curl\s+[^\n]*(?:-u|--user)\s+\S+:\S+/i, label: 'curl with credentials', severity: 'HIGH', confidence: 90, description: 'curl 命令中包含凭证', fix: '使用环境变量或 -H "Authorization: Bearer $TOKEN"' },
  { pattern: /curl\s+[^\n]*(?:-H|--header)\s+["']Authorization:/i, label: 'curl with auth header', severity: 'MEDIUM', confidence: 70, description: 'curl 命令中包含 Authorization 头', fix: '确保使用环境变量，不要硬编码 token' },
  { pattern: /(?:export|set)\s+(?:API_KEY|SECRET|TOKEN|PASSWORD|PWD)\s*=/i, label: 'Secret in env variable', severity: 'MEDIUM', confidence: 60, description: '在命令中设置敏感环境变量', fix: '使用 .env 文件或 secrets manager' },
  { pattern: /(?:psql|mysql|sqlcmd)\s+[^\n]*(?:-p|--password)\s+\S+/i, label: 'DB password in command', severity: 'HIGH', confidence: 95, description: '数据库命令中包含密码', fix: '使用 .pgpass 或环境变量' },
  { pattern: /(?:git\s+push\s+https?:\/\/)[^@]*:[^@]*@/, label: 'Git push with credentials in URL', severity: 'HIGH', confidence: 95, description: 'Git 推送 URL 中包含凭证', fix: '使用 SSH 或 credential helper' },
];

const SKIP_PATTERNS = [/\.(md|txt|rst)$/i, /\.example$/i, /README/i, /CHANGELOG/i, /\.test\./i, /\.spec\./i];
const SAFE_CONTENT = [/\$\{?\w+\}?/, /Environment\.GetEnvironmentVariable/i, /process\.env\./i, /os\.environ/i, /os\.getenv/i];
const SAFE_BASH_PATTERNS = [/\$\{?\w+\}?/, /rtk\s+/, /git\s+/];

// ============================================================
// 扩展规则加载
// ============================================================

function loadCustomPatterns() {
  const customPatterns = [];
  const userPatternsFile = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'security-patterns.json');
  if (fs.existsSync(userPatternsFile)) {
    try { customPatterns.push(...JSON.parse(fs.readFileSync(userPatternsFile, 'utf8'))); } catch (e) {}
  }
  const projectPatternsFile = path.join(process.cwd(), '.claude', 'security-patterns.json');
  if (fs.existsSync(projectPatternsFile)) {
    try { customPatterns.push(...JSON.parse(fs.readFileSync(projectPatternsFile, 'utf8'))); } catch (e) {}
  }
  return customPatterns;
}

// ============================================================
// 置信度评分
// ============================================================

function calculateConfidence(match, pattern, context) {
  let confidence = pattern.confidence || 70;
  if (/\$\{?\w+\}?/.test(match) || /%[A-Z_]+%/.test(match)) confidence -= 30;
  if (context.filePath && /\.(test|spec)\./.test(context.filePath)) confidence -= 20;
  if (context.filePath && /\.example$/i.test(context.filePath)) confidence -= 40;
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
    const customPatterns = loadCustomPatterns();

    // ===== Bash 命令检测 =====
    if (toolName === 'Bash') {
      const command = (input.tool_input && input.tool_input.command) || '';
      if (!command || command.length < 5) { process.stdout.write(data); return; }
      if (SAFE_BASH_PATTERNS.some(p => p.test(command))) { process.stdout.write(data); return; }

      const findings = [];
      for (const pattern of BASH_SECRET_PATTERNS) {
        const match = command.match(pattern.pattern);
        if (match) {
          const matchedText = match[0];
          const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
          if (!isSafe) {
            const confidence = calculateConfidence(matchedText, pattern, {});
            if (confidence >= 60) {
              findings.push({ label: pattern.label, matched: matchedText.substring(0, 60), severity: pattern.severity, confidence, description: pattern.description, fix: pattern.fix });
            }
          }
        }
      }

      if (findings.length > 0) {
        process.stderr.write('[Hook] BLOCKED: Potential secret leak in Bash command\n');
        findings.forEach(f => {
          process.stderr.write(`[Hook]   - [${f.severity}] ${f.label} (置信度: ${f.confidence}%)\n`);
          process.stderr.write(`[Hook]     匹配: "${f.matched}..."\n`);
          process.stderr.write(`[Hook]     说明: ${f.description}\n`);
          process.stderr.write(`[Hook]     修复: ${f.fix}\n`);
        });
        process.exit(2); return;
      }
      process.stdout.write(data);
      return;
    }

    // ===== Write/Edit 文件内容检测 =====
    if (toolName !== 'Write' && toolName !== 'Edit') { process.stdout.write(data); return; }
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (SKIP_PATTERNS.some(p => p.test(filePath))) { process.stdout.write(data); return; }
    if (!content || content.length < 10) { process.stdout.write(data); return; }

    const findings = [];
    for (const pattern of SECRET_PATTERNS) {
      const match = content.match(pattern.pattern);
      if (match) {
        const matchedText = match[0];
        const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
        if (!isSafe) {
          const confidence = calculateConfidence(matchedText, pattern, { filePath });
          if (confidence >= 60) {
            findings.push({ label: pattern.label, matched: matchedText.substring(0, 60), severity: pattern.severity, confidence, description: pattern.description, fix: pattern.fix });
          }
        }
      }
    }

    for (const pattern of customPatterns) {
      try {
        const regex = new RegExp(pattern.pattern, pattern.flags || 'i');
        const match = content.match(regex);
        if (match) {
          const matchedText = match[0];
          const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
          if (!isSafe) {
            findings.push({ label: pattern.label || 'Custom pattern', matched: matchedText.substring(0, 60), severity: pattern.severity || 'MEDIUM', confidence: pattern.confidence || 70, description: pattern.description || '项目特定的安全规则', fix: pattern.fix || '请检查代码' });
          }
        }
      } catch (e) {}
    }

    if (findings.length > 0) {
      process.stderr.write('[Hook] BLOCKED: Potential hardcoded secrets detected\n');
      findings.forEach(f => {
        process.stderr.write(`[Hook]   - [${f.severity}] ${f.label} (置信度: ${f.confidence}%)\n`);
        process.stderr.write(`[Hook]     匹配: "${f.matched}..."\n`);
        process.stderr.write(`[Hook]     说明: ${f.description}\n`);
        process.stderr.write(`[Hook]     修复: ${f.fix}\n`);
      });
      process.exit(2); return;
    }

    process.stdout.write(data);
  } catch (e) {
    process.stderr.write("[Hook Error] secret-guard-enhanced: " + e.message + "\n");
    process.exit(2);
  }
});
