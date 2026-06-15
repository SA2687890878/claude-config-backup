#!/usr/bin/env node
/**
 * PostToolUse hook: 记录工具调用统计
 *
 * 功能：
 * 1. 记录工具调用次数
 * 2. 记录调用时间
 * 3. 写入 metrics 目录
 *
 * 符合 Claude 官方 hook 规范：
 * - stdin: 读取 JSON 输入 { tool_name, tool_input }
 * - stdout: 无输出
 * - stderr: 信息性提示
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

function getNow() {
  return new Date().toISOString();
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw || !raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const toolName = input.tool_name || 'unknown';

    const today = getToday();
    const now = getNow();

    // 确保目录存在
    if (!fs.existsSync(METRICS_DIR)) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
    }
    const dailyDir = path.join(METRICS_DIR, 'daily');
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir, { recursive: true });
    }

    // 读取今日统计
    const dailyFile = path.join(dailyDir, `${today}.json`);
    let dailyStats = {};
    if (fs.existsSync(dailyFile)) {
      try {
        dailyStats = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
      } catch (_) {
        dailyStats = {};
      }
    }

    // 初始化今日统计（只初始化缺失字段，不覆盖已有数据）
    if (!dailyStats.date) dailyStats.date = today;
    if (!dailyStats.tools) dailyStats.tools = {};
    if (!dailyStats.totalCalls) dailyStats.totalCalls = 0;
    if (!dailyStats.firstCall) dailyStats.firstCall = now;

    // 更新统计
    if (!dailyStats.tools[toolName]) {
      dailyStats.tools[toolName] = {
        count: 0,
        firstCall: now,
        lastCall: now
      };
    }
    dailyStats.tools[toolName].count++;
    dailyStats.tools[toolName].lastCall = now;
    dailyStats.totalCalls++;
    dailyStats.lastCall = now;

    // 写入文件
    fs.writeFileSync(dailyFile, JSON.stringify(dailyStats, null, 2), 'utf8');

  } catch (e) { console.error('[metrics-collector] Error:', e.message); }
  process.exit(0);
})();
