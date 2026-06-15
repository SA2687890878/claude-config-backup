#!/usr/bin/env node
/**
 * Logic Guard Hook (PostToolUse)
 * C# 常见逻辑错误检测：并发问题、字符串判断顺序、资源使用等
 *
 * Stdin:  JSON { tool_name, tool_input, tool_output }
 * Stderr: User-facing warnings (shown in UI)
 * stdout: JSON { decision: 'block', reason: '...' } for HIGH issues
 */
const path = require('path');

// ===== 逻辑错误检测 =====

function checkForeachAwait(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    // 检测 foreach 中直接 await
    if (/foreach\s*\(/.test(ln)) {
      let hasAsyncInLoop = false;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const inner = lines[j].trim();
        if (inner === '}') break;
        if (/await\s+/.test(inner) && !/Task\.WhenAll|Task\.WhenAny/.test(inner)) {
          hasAsyncInLoop = true;
          break;
        }
      }
      if (hasAsyncInLoop) {
        out.push(`⚠️ foreach 中直接 await 异步操作（第 ${i + 1} 行），应考虑 Task.WhenAll 或 Parallel.ForEachAsync`);
      }
    }
  }
  return out;
}

function checkStringOrder(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    // 检测 string.IsNullOrEmpty(xxx).Trim() —— 顺序错误
    if (/string\.IsNullOrEmpty\(.*\)\.Trim\(\)/.test(ln)) {
      out.push(`🚫 string.IsNullOrEmpty 后调用 .Trim()（第 ${i + 1} 行）—— 可能 NullReferenceException`);
    }
    // 检测 == null || == "" —— 应用 string.IsNullOrEmpty
    if (/==\s*null\s*\|\|\s*==\s*""\s/.test(ln) || /=\s*null\s*\|\|\s*=\s*""\s/.test(ln)) {
      out.push(`⚠️ == null || == ""（第 ${i + 1} 行）—— 应使用 string.IsNullOrEmpty()`);
    }
    // 检测 == null || == "" —— 应用 string.IsNullOrEmpty
    if (/!=\s*null\s*&&\s*!=\s*""\s/.test(ln)) {
      out.push(`⚠️ != null && != ""（第 ${i + 1} 行）—— 应使用 !string.IsNullOrEmpty()`);
    }
  }
  return out;
}

function checkDisposeAfterUse(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    // 检测 Dispose 后继续使用
    if (/\.Dispose\(\)/.test(ln)) {
      // 提取变量名
      const match = ln.match(/(\w+)\.Dispose\(\)/);
      if (match) {
        const varName = match[1];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLn = lines[j].trim();
          if (nextLn.includes(varName + '.') && !/^\s*\/\//.test(nextLn)) {
            out.push(`🚫 Dispose 后继续使用 ${varName}（第 ${j + 1} 行）`);
            break;
          }
        }
      }
    }
  }
  return out;
}

function checkTaskRunSync(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    // 检测 Task.Run 包装同步代码（无意义的异步包装）
    if (/Task\.Run\s*\(\s*\(\)\s*=>\s*\{/.test(ln)) {
      // 检查是否有 await
      let hasAsync = false;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (/await\s+/.test(lines[j])) { hasAsync = true; break; }
        if (/\}\)/.test(lines[j])) break;
      }
      if (!hasAsync) {
        out.push(`💡 Task.Run 包装同步代码（第 ${i + 1} 行）—— 无意义的异步包装`);
      }
    }
  }
  return out;
}

function checkEmptyCatchWithReturn(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (/catch\s*\(/.test(ln)) {
      let catchContent = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const inner = lines[j].trim();
        if (inner === '}') break;
        catchContent += inner + ' ';
      }
      // 空 catch 且 try 中有 return
      if (!catchContent.trim() || catchContent.trim() === '// TODO') {
        // 向上找 try
        for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
          if (/try\s*\{/.test(lines[k])) {
            for (let m = k + 1; m < i; m++) {
              if (/return\s/.test(lines[m])) {
                out.push(`🚫 try 中有 return，但 catch 为空（第 ${i + 1} 行）—— 异常被静默吞掉`);
                break;
              }
            }
            break;
          }
        }
      }
    }
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
    if (content.length < 50) return; // 太短的代码不检查

    const fileName = path.basename(filePath);
    const lines = content.split('\n');
    const blocks = [];
    const warnings = [];

    // 运行所有检查
    const checks = [
      { fn: checkStringOrder, level: 'block' },
      { fn: checkDisposeAfterUse, level: 'block' },
      { fn: checkEmptyCatchWithReturn, level: 'block' },
      { fn: checkForeachAwait, level: 'warn' },
      { fn: checkTaskRunSync, level: 'warn' },
    ];

    for (const check of checks) {
      const results = check.fn(lines);
      if (check.level === 'block') {
        blocks.push(...results);
      } else {
        warnings.push(...results);
      }
    }

    // BLOCK 级别问题 → 警告（PostToolUse 不阻断，避免回滚用户修改）
    if (blocks.length > 0) {
      console.error(`\n[Logic Guard] ${fileName}:`);
      blocks.forEach(w => console.error(`  🚫 ${w}`));
      console.error('[Logic Guard] ⚠️ 请修复上述问题。');
    }

    // WARN 级别问题
    if (warnings.length > 0) {
      console.error(`\n[Logic Guard] ${fileName}:`);
      warnings.forEach(w => console.error(`  ⚠️ ${w}`));
      console.error('');
    }
  } catch (e) { console.error("[Hook Error] logic-guard: " + e.message); }
});
