#!/usr/bin/env node
/**
 * PostToolUse hook: 记录关键工具调用统计（优化版）
 *
 * 功能：
 * 1. 只记录关键工具（高成本、质量信号）
 * 2. 跳过低价值工具（Read、Bash等日常查询）
 * 3. 写入 metrics 目录
 *
 * 符合 Claude 官方 hook 规范
 */
const fs = require('fs');
const path = require('path');

const HOME = process.env.USERPROFILE || process.env.HOME || '';
const METRICS_DIR = path.join(HOME, '.claude', 'metrics');

// 关键工具白名单
const TRACKED_TOOLS = new Set([
  // 高成本操作
  'Agent', 'Workflow',
  // 外部调用
  'WebSearch', 'WebFetch', 'mcp__exa-search__web_search_exa', 'mcp__exa-search__web_fetch_exa',
  'mcp__codegraph__codegraph_explore', 'mcp__codegraph__codegraph_node',
  // 质量信号（代码修改）
  'Edit', 'Write',
  // Build/Test
  'Build', 'Test'
]);

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

    // 过滤：只记录关键工具
    if (!TRACKED_TOOLS.has(toolName)) process.exit(0);

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

    // 初始化今日统计
    if (!dailyStats.date) dailyStats.date = today;
    if (!dailyStats.tools) dailyStats.tools = {};
    if (!dailyStats.trackedCalls) dailyStats.trackedCalls = 0;
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
    dailyStats.trackedCalls++;
    dailyStats.lastCall = now;

    // 写入文件
    try {
      fs.writeFileSync(dailyFile, JSON.stringify(dailyStats, null, 2), 'utf8');
    } catch (e) {
      console.error('[metrics-collector] Failed to write metrics:', e.message);
    }

  } catch (e) { console.error('[metrics-collector] Error:', e.message); }
  process.exit(0);
})();
