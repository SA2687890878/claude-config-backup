#!/usr/bin/env node
/**
 * Secret Guard Hook (PreToolUse)
 * Scans Write/Edit content and Bash commands for hardcoded secrets.
 */
const SECRET_PATTERNS = [
  { pattern: /Password\s*=\s*[^;{}\s$"']+/i, label: 'Connection string password' },
  { pattern: /Server\s*=\s*[^;]+;.*Password\s*=\s*[^;]+/i, label: 'DB connection string' },
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"'${]{8,}["']/i, label: 'Hardcoded API key' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]{20,}/i, label: 'Hardcoded Bearer token' },
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/, label: 'Private key' },
  { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key' },
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'${]{4,}["']/i, label: 'Hardcoded password' },
  { pattern: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub personal access token' },
  { pattern: /gho_[A-Za-z0-9]{36}/, label: 'GitHub OAuth token' },
  { pattern: /github_pat_[A-Za-z0-9_]{22,}/, label: 'GitHub fine-grained PAT' },
  { pattern: /glpat-[A-Za-z0-9\-_]{20,}/, label: 'GitLab personal access token' },
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/, label: 'Anthropic API key' },
  { pattern: /\btp-[A-Za-z0-9]{32,}/, label: 'Anthropic/proxy auth token' },
  { pattern: /\bsk-[A-Za-z0-9]{32,}/, label: 'OpenAI-style API key' },
  { pattern: /ANTHROPIC_(?:AUTH_TOKEN|API_KEY)\s*[:=]\s*["']?[A-Za-z0-9\-_]{16,}/i, label: 'Anthropic credential assignment' },
];
const SKIP_PATTERNS = [/\.(md|txt|rst)$/i, /\.example$/i, /README/i, /CHANGELOG/i];
const SAFE_CONTENT = [/$\{?\w+\}?/, /Environment\.GetEnvironmentVariable/i, /process\.env\./i];

// Bash 命令中的敏感信息检测
const BASH_SECRET_PATTERNS = [
  { pattern: /curl\s+[^\n]*(?:-u|--user)\s+\S+:\S+/i, label: 'curl with credentials' },
  { pattern: /curl\s+[^\n]*(?:-H|--header)\s+["']Authorization:/i, label: 'curl with auth header' },
  { pattern: /(?:export|set)\s+(?:API_KEY|SECRET|TOKEN|PASSWORD|PWD)\s*=/i, label: 'Secret in env variable' },
  { pattern: /echo\s+["'][^"']*(?:password|secret|token|key)[^"']*["']\s*>/i, label: 'Secret written to file' },
  { pattern: /(?:psql|mysql|sqlcmd)\s+[^\n]*(?:-p|--password)\s+\S+/i, label: 'DB password in command' },
  { pattern: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub token in command' },
  { pattern: /github_pat_[A-Za-z0-9_]{22,}/, label: 'GitHub PAT in command' },
  { pattern: /glpat-[A-Za-z0-9\-_]{20,}/, label: 'GitLab token in command' },
  { pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/, label: 'Anthropic API key in command' },
  { pattern: /\btp-[A-Za-z0-9]{32,}/, label: 'Anthropic/proxy auth token in command' },
  { pattern: /\bsk-[A-Za-z0-9]{32,}/, label: 'OpenAI-style API key in command' },
];
const SAFE_BASH_PATTERNS = [/\$\{?\w+\}?/, /rtk\s+/, /git\s+/];

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // ===== Bash 命令检测 =====
    if (toolName === 'Bash') {
      const command = (input.tool_input && input.tool_input.command) || '';
      if (!command || command.length < 5) { console.log(data); return; }

      // 跳过安全命令
      if (SAFE_BASH_PATTERNS.some(p => p.test(command))) { console.log(data); return; }

      const findings = [];
      for (const { pattern, label } of BASH_SECRET_PATTERNS) {
        const match = command.match(pattern);
        if (match) {
          const matchedText = match[0];
          const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
          if (!isSafe) findings.push({ label, matched: matchedText.substring(0, 60) });
        }
      }
      if (findings.length > 0) {
        console.error('[Hook] BLOCKED: Potential secret leak in Bash command');
        findings.forEach(f => console.error('[Hook]   - ' + f.label + ': "' + f.matched + '..."'));
        console.error('[Hook] Use environment variables or secrets manager instead.');
        process.exit(2); return;
      }
      console.log(data);
      return;
    }

    // ===== Write/Edit 文件内容检测 =====
    if (toolName !== 'Write' && toolName !== 'Edit') { console.log(data); return; }
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (SKIP_PATTERNS.some(p => p.test(filePath))) { console.log(data); return; }
    if (!content || content.length < 10) { console.log(data); return; }
    const findings = [];
    for (const { pattern, label } of SECRET_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        const matchedText = match[0];
        const isSafe = SAFE_CONTENT.some(sp => sp.test(matchedText));
        if (!isSafe) findings.push({ label, matched: matchedText.substring(0, 60) });
      }
    }
    if (findings.length > 0) {
      console.error('[Hook] BLOCKED: Potential hardcoded secrets detected');
      findings.forEach(f => console.error('[Hook]   - ' + f.label + ': "' + f.matched + '..."'));
      console.error('[Hook] Use environment variables or secrets manager instead.');
      process.exit(2); return;
    }
    console.log(data);
  } catch (e) { console.log(data); }
});
