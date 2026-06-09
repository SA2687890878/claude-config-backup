#!/usr/bin/env node
/**
 * Quality Guard Hook (PostToolUse)
 * C# best practice checks: SQL injection, hardcoded values, null safety,
 * resource disposal, CancellationToken, exception handling.
 *
 * Stdin:  JSON { tool_name, tool_input, tool_output }
 * Stderr: User-facing warnings (shown in UI)
 */
const path = require('path');

// ===== Pattern-based checks =====
const PATTERN_CHECKS = [
  {
    re: /["`]\s*(?:SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN)\s+.*["`]\s*\+/gi,
    msg: '可能的 SQL 注入风险（字符串拼接 SQL）',
    tag: '⚠'
  },
  {
    re: /["']\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?["']/g,
    msg: '硬编码 IP 地址',
    tag: '⚠'
  },
  {
    re: /(?:port|Port)\s*[:=]\s*(?!80\b|443\b|8080\b)\d{2,5}/g,
    msg: '硬编码端口号',
    tag: '⚠'
  },
  {
    re: /\/\/\s*(?:TODO|FIXME|HACK|XXX|TEMP)\b/gi,
    msg: '遗留的 TODO/FIXME 标记',
    tag: '📝'
  },
  {
    re: /\/\/\s*(?:if|for|while|var|return|public|private|protected)\b/g,
    msg: '注释掉的代码（考虑删除）',
    tag: '💡'
  }
];

// ===== Logic-based checks =====

function checkNullSafety(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(?:Find|FirstOrDefault|SingleOrDefault|First|Single)(?:Async)?\s*\(/.test(lines[i])) continue;
    let hasNullCheck = false;
    let propLine = -1;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const ln = lines[j].trim();
      if (/if\s*\(|==\s*null|!=\s*null|\?\.|\.HasValue|null\s*\?/.test(ln)) { hasNullCheck = true; break; }
      if (/\w+\.\w+/.test(ln) && !/^\s*\/\//.test(ln)) { propLine = j + 1; break; }
    }
    if (propLine > 0 && !hasNullCheck) out.push(`⚠ Find/FirstOrDefault 后未检查 null（第 ${propLine} 行）`);
  }
  return out;
}

function checkResourceDisposal(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/new\s+(?:SqlConnection|HttpClient|FileStream|StreamReader|StreamWriter|MemoryStream|WebClient|TcpClient|UdpClient)\b/.test(ln)) continue;
    if (/using\s/.test(ln)) continue;
    let hasUsing = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (/using\s/.test(lines[j])) { hasUsing = true; break; }
    }
    if (!hasUsing) out.push(`⚠ 资源未 using 释放（第 ${i + 1} 行）`);
  }
  return out;
}

function checkCancellationToken(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/(?:public|private|protected|internal)\s+async\s+Task/.test(lines[i])) continue;
    if (/CancellationToken/.test(lines[i])) continue;
    let hasAsyncDb = false;
    for (let j = i; j < Math.min(i + 30, lines.length); j++) {
      if (/(?:ToListAsync|FirstOrDefaultAsync|FindAsync|SaveChangesAsync|ExecuteSqlRawAsync)\s*\(/.test(lines[j])) { hasAsyncDb = true; break; }
    }
    if (hasAsyncDb) out.push(`⚠ async 方法缺少 CancellationToken（第 ${i + 1} 行）`);
  }
  return out;
}

function checkExceptionHandling(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/catch\s*\(\s*Exception\s*(?:\w+)?\s*\)/.test(lines[i].trim())) continue;
    let hasContent = false;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const ln = lines[j].trim();
      if (ln && !ln.startsWith('//') && ln !== '{' && ln !== '}') { hasContent = true; break; }
    }
    if (!hasContent) out.push(`⚠ catch (Exception) 块为空（第 ${i + 1} 行）— 至少记录日志`);
  }
  return out;
}

// ===== Main =====
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!/[.]cs$/i.test(filePath)) return;

    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string)) || '';
    if (!content) return;
    // Write 用 content，Edit 用 new_string；两者长度不同，统一用 30 作为下限
    if (content.length < 30) return;

    const fileName = path.basename(filePath);
    const lines = content.split('\n');
    const warnings = [];

    // Pattern checks
    for (const chk of PATTERN_CHECKS) {
      const m = content.match(chk.re);
      if (m && m.length > 0) warnings.push(`${chk.tag} ${chk.msg}（${m.length} 处）`);
    }

    // Logic checks
    warnings.push(...checkNullSafety(lines));
    warnings.push(...checkResourceDisposal(lines));
    warnings.push(...checkCancellationToken(lines));
    warnings.push(...checkExceptionHandling(lines));

    if (warnings.length > 0) {
      console.error(`\n[Quality Guard] ${fileName}:`);
      warnings.forEach(w => console.error(`  ${w}`));
      console.error('');
    }
  } catch (e) { console.error("[Hook Error] quality-guard: " + e.message); }
});
