#!/usr/bin/env node
/**
 * Harness 元评测 Judge（P0 落地 · 建议1）
 *
 * 用途：给 Harness 自身产出打分（正确性/规范性/简洁性 三维独立），校准评测集。
 * 设计：temperature 约束为确定性输出（只用 JSON，不解释）；结果带 evidence 便于溯源。
 *
 * 用法：
 *   node judge.mjs score <file>                          # 单文件打分
 *   node judge.mjs batch <dir> [--ext .md] [--limit N]   # 批量打分目录，结果写 evals/judge-report.jsonl
 *   node judge.mjs check [<meta-eval.jsonl>] [--threshold 90]  # 校准评测集：judge 能多准地区分正/负例
 *
 * 环境变量：ANTHROPIC_AUTH_TOKEN（或 ANTHROPIC_API_KEY）、ANTHROPIC_BASE_URL、JUDGE_MODEL（可选）
 * 触发：仅 knowledge/** + skills/** + learnings.md + CLAUDE.md 变更后手动/CI 跑，不进日常 prompt。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
const MODEL = process.env.JUDGE_MODEL || 'claude-sonnet-4-20250514';
const MAX_WAIT = 120000;

const SCORE_PROMPT = `你是 Harness 输出质量评审员。对给定内容按三个维度独立打分（0-10 整数）：
- correctness 正确性：结论准确、逻辑成立、证据真实可核（不编造文件:行号）
- normativity 规范性：符合规则/格式/门禁要求、可执行可测试
- conciseness 简洁性：信息密度高、不啰嗦、无空话套话

输出规则（必须严格遵守）：
1. 只输出一个 JSON 对象，不要 markdown 围栏、不要任何解释性文字
2. 格式：{"score":0-10,"dimension":{"correctness":0-10,"normativity":0-10,"conciseness":0-10},"reason":"一句话理由","evidence":"证据位置(文件:行号/命令/数据)，无则空串"}
3. 总分 score = 正确性×0.5 + 规范性×0.25 + 简洁性×0.25，保留一位小数`;

function fail(msg, code = 3) { console.error('[judge] ' + msg); process.exit(code); }

async function callLLM(content) {
  if (!API_KEY) fail('缺少环境变量 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY');
  let resp;
  try {
    resp = await fetch(`${BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: SCORE_PROMPT + '\n\n=====待评测内容=====\n' + content.slice(0, 4000) }]
      }),
      signal: AbortSignal.timeout(MAX_WAIT)
    });
  } catch (e) { fail('LLM 调用失败: ' + e.message); }
  if (!resp.ok) fail(`LLM API ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  const text = data?.content?.[0]?.text || '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) fail('LLM 返回未含 JSON: ' + text.slice(0, 200));
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch { fail('返回 JSON 解析失败'); }
  for (const k of ['correctness', 'normativity', 'conciseness']) {
    if (typeof parsed?.dimension?.[k] !== 'number') fail('维度字段缺失: ' + k);
  }
  return parsed;
}

function readContent(target) {
  if (!fs.existsSync(target)) fail(`文件不存在: ${target}`);
  return fs.readFileSync(target, 'utf8');
}

async function cmdScore(file) {
  const j = await callLLM(readContent(file));
  console.log(JSON.stringify({ file: path.relative(ROOT, file), ...j }, null, 2));
  return 0;
}

async function cmdBatch(dir, ext, limit) {
  if (!fs.existsSync(dir)) fail(`目录不存在: ${dir}`);
  const files = [];
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (files.length >= limit) return;
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith(ext)) files.push(fp);
    }
  };
  walk(dir);
  if (files.length === 0) fail(`目录下无 ${ext} 文件`);
  console.error(`[judge] 批量打分 ${files.length} 个文件（limit=${limit}）…`);
  const out = [];
  for (const f of files) {
    try {
      const j = await callLLM(readContent(f));
      out.push({ file: path.relative(ROOT, f), ...j });
    } catch (e) { console.error(`[judge] ${path.basename(f)} 打分失败: ${e.message}`); }
  }
  const report = path.join(ROOT, 'evals', 'judge-report.jsonl');
  fs.writeFileSync(report, out.map((x) => JSON.stringify(x)).join('\n') + '\n', 'utf8');
  console.error(`[judge] 完成 ${out.length}/${files.length}，报告 → ${path.relative(ROOT, report)}`);
  return 0;
}

async function cmdCheck(evalFile, threshold) {
  const lines = fs.readFileSync(evalFile, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) fail('评测集为空');
  let pass = 0;
  const errors = [];
  for (const line of lines) {
    const entry = JSON.parse(line);
    try {
      const j = await callLLM(entry.prompt + '\n\n=====模型回答=====\n' + entry.response);
      const expectGood = entry.label === 'good';
      const scoreOk = expectGood ? j.score >= 7 : j.score < 7;
      if (scoreOk) pass++;
      else errors.push({ id: entry.id, label: entry.label, defect: entry.defect, judgeScore: j.score, reason: j.reason });
    } catch (e) { errors.push({ id: entry.id, error: e.message }); }
  }
  const acc = parseFloat(((pass / lines.length) * 100).toFixed(1));
  console.log(JSON.stringify({ eval: path.basename(evalFile), total: lines.length, passed: pass, accuracy: acc, threshold, errors }, null, 2));
  return acc >= threshold ? 0 : 1;
}

const [cmd, ...args] = process.argv.slice(2);
const argVal = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
switch (cmd) {
  case 'score': {
    const f = args.find((a) => !a.startsWith('--'));
    if (!f) fail('用法: judge.mjs score <file>');
    process.exitCode = await cmdScore(f);
    break;
  }
  case 'batch': {
    const dir = args.find((a) => !a.startsWith('--')) || '.';
    process.exitCode = await cmdBatch(dir, argVal('--ext', '.md'), parseInt(argVal('--limit', '50'), 10));
    break;
  }
  case 'check': {
    const f = args.find((a) => !a.startsWith('--')) || path.join(ROOT, 'evals', 'meta-eval.jsonl');
    process.exitCode = await cmdCheck(f, parseFloat(argVal('--threshold', '90')));
    break;
  }
  default: fail('用法: judge.mjs <score|batch|check> [参数]');
}
