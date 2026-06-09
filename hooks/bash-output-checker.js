#!/usr/bin/env node
/**
 * Bash PostToolUse Hook
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入
 * - stdout: 成功时输出原始 JSON
 * - stderr: 错误时输出错误信息
 * - exit code: 0=成功，2=阻塞
 */

const fs = require('fs');

// ============================================================
// 错误和警告模式
// ============================================================

const ERROR_PATTERNS = [
  /error[:\s]/i,
  /fatal[:\s]/i,
  /failed[:\s]/i,
  /exception[:\s]/i,
  /cannot[:\s]/i,
  /permission denied/i,
  /not found/i,
  /no such file/i,
  /access denied/i
];

const WARNING_PATTERNS = [
  /warning[:\s]/i,
  /warn[:\s]/i,
  /deprecated/i
];

// ============================================================
// 主逻辑
// ============================================================

let inputData = '';
process.stdin.on('data', (chunk) => { inputData += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);
    const output = input.tool_output || '';

    if (!output) {
      process.stdout.write(inputData);
      return;
    }

    const lines = output.split('\n');
    const errors = [];
    const warnings = [];

    for (const line of lines) {
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.test(line)) {
          errors.push(line.trim());
          break;
        }
      }
      for (const pattern of WARNING_PATTERNS) {
        if (pattern.test(line)) {
          warnings.push(line.trim());
          break;
        }
      }
    }

    // 输出结果到 stderr（会反馈给 Claude）
    if (errors.length > 0) {
      process.stderr.write(`[Hook] ❌ 发现 ${errors.length} 个错误:\n`);
      errors.slice(0, 5).forEach(e => process.stderr.write(`[Hook]   - ${e}\n`));
      if (errors.length > 5) {
        process.stderr.write(`[Hook]   ... 还有 ${errors.length - 5} 个错误\n`);
      }
    }

    if (warnings.length > 0) {
      process.stderr.write(`[Hook] ⚠️ 发现 ${warnings.length} 个警告:\n`);
      warnings.slice(0, 3).forEach(w => process.stderr.write(`[Hook]   - ${w}\n`));
      if (warnings.length > 3) {
        process.stderr.write(`[Hook]   ... 还有 ${warnings.length - 3} 个警告\n`);
      }
    }

    // 始终输出原始 JSON 到 stdout
    process.stdout.write(inputData);
  } catch (e) {
    // 解析失败，输出原始数据
    process.stdout.write(inputData);
  }
});
