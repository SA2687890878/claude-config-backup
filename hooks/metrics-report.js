#!/usr/bin/env node
/**
 * Stop hook: 输出本次会话的度量报告
 *
 * 功能：
 * 1. 读取今日统计
 * 2. 输出到 stderr（用户可见）
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入 { cwd }
 * - stdout: 无输出
 * - stderr: 度量报告
 * - exit code: 0
 */
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
const METRICS_DIR = path.join(HOME, '.claude', 'metrics');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000);
  });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);

    const today = getToday();
    const dailyFile = path.join(METRICS_DIR, 'daily', `${today}.json`);

    if (!fs.existsSync(dailyFile)) {
      process.exit(0);
    }

    let dailyStats;
    try {
      dailyStats = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
    } catch (e) {
      console.error('[metrics-report] ⚠️ 统计数据损坏:', e.message);
      process.exit(0);
    }

    // 构建报告
    const lines = [];
    lines.push('');
    lines.push('📊 今日度量报告');
    lines.push('─'.repeat(40));
    lines.push(`总调用次数: ${dailyStats.totalCalls}`);

    // 工具统计
    const toolEntries = Object.entries(dailyStats.tools || {})
      .sort((a, b) => b[1].count - a[1].count);

    if (toolEntries.length > 0) {
      lines.push('');
      lines.push('工具调用统计:');
      for (const [tool, stats] of toolEntries.slice(0, 10)) {
        lines.push(`  ${tool}: ${stats.count} 次`);
      }
      if (toolEntries.length > 10) {
        lines.push(`  ... 还有 ${toolEntries.length - 10} 个工具`);
      }
    }

    lines.push('─'.repeat(40));

    console.error(lines.join('\n'));

  } catch (e) { console.error('[metrics-report] Error:', e.message); }
  process.exit(0);
})();
