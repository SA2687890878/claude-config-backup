#!/usr/bin/env node
/**
 * Harness 质量门禁可执行化（P0 落地 · 建议2）
 *
 * 把 5 道门禁文档（requirement/design/code/test/release）中"能自动断言"的检查项变成脚本，
 * 复用"退出码为王"：不看自述，只看可核证据。
 *
 * 退出码：
 *   0 = 全部自动检查项 PASS（可放行）
 *   1 = 有 FAIL（阻断，需回对应阶段修）
 *   2 = 无 FAIL 但有 SKIP(manual)（自动化项过了，剩余项必须人审）
 *   3 = 用法/参数错误
 *
 * 用法：
 *   node eval-gates.mjs requirement --dir <项目目录> [--doc <需求文档路径>]
 *   node eval-gates.mjs design      --dir <项目目录> [--doc <设计文档>] [--req <需求文档>] [--report <review报告>]
 *   node eval-gates.mjs code        --dir <项目目录> [--run-build] [--diff <git diff --stat 输出文件>]
 *   node eval-gates.mjs test        --dir <项目目录> [--run-build]
 *   node eval-gates.mjs release     --dir <项目目录> [--report <审查报告>] [--changelog <CHANGELOG>] [--rollback <回滚文档>]
 *   node eval-gates.mjs all         --dir <项目目录> [--run-build] [--report <审查报告>]
 *
 * 说明：SKIP(manual) = 该检查项无法脚本断言、必须人审——脚本显式列出，不假装自动化。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const GATES = ['requirement', 'design', 'code', 'test', 'release'];
let results = [];
const check = (gate, name, status, detail = '') => results.push({ gate, name, status, detail });

const argVal = (name, def) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : def);
const hasArg = (name) => process.argv.includes(name);

function run(cmd, dir) {
  try {
    const out = execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function findFile(dir, patterns) {
  for (const p of patterns) {
    const full = path.join(dir, p);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function walkFind(dir, suffix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'bin', 'obj', 'evals', 'scripts', 'hooks'].includes(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) { const f = walkFind(fp, suffix); if (f) return f; }
    else if (fp.endsWith(suffix)) return fp;
  }
  return null;
}

function findGlob(dir, patterns) {
  for (const p of patterns) {
    if (p.startsWith('**/')) { const f = walkFind(dir, p.slice(3)); if (f) return f; }
    else { const full = path.join(dir, p); if (fs.existsSync(full)) return full; }
  }
  return null;
}

function findTestProj(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'bin', 'obj'].includes(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) { const f = findTestProj(fp); if (f) return f; }
    else if (/\.(tests?|test)\.csproj$/i.test(e.name)) return fp;
  }
  return null;
}

function findTestFile(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'bin', 'obj'].includes(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) { const f = findTestFile(fp); if (f) return f; }
    else if (e.name.toLowerCase().endsWith('.cs') && /\.tests?\./i.test(fp)) return fp;
  }
  return null;
}

function grepHas(file, regex) {
  return new RegExp(regex, 'i').test(fs.readFileSync(file, 'utf8'));
}

// ---- requirement ----
function gateRequirement(dir) {
  const doc = argVal('--doc') || findFile(dir, ['docs/requirements.md', 'requirements.md', 'docs/*.req.md', 'docs/*.requirement*.md']);
  if (!doc) { check('requirement', '需求文档存在', 'FAIL', '未找到需求文档'); return; }
  check('requirement', '需求文档存在', 'PASS', path.basename(doc));
  check('requirement', '验收标准可衡量', grepHas(doc, 'Given|When|Then|验收|acceptance|可衡量') ? 'PASS' : 'FAIL', '需含 Given/When/Then 或验收标准');
  check('requirement', '边界条件定义', grepHas(doc, '边界|异常|空值|并发|性能|limit') ? 'PASS' : 'FAIL', '需含边界/异常/约束');
  check('requirement', '无模糊措辞', grepHas(doc, '用户觉得|体验好|随便|大概|差不多') ? 'FAIL' : 'PASS', '不得含"用户觉得/体验好"类');
  check('requirement', '可测试可验收', grepHas(doc, '测试|验证|用例|场景') ? 'PASS' : 'SKIP', '含测试/验证线索则自动过，否则人工确认');
}

// ---- design ----
function gateDesign(dir) {
  const doc = argVal('--doc') || findFile(dir, ['docs/design.md', 'docs/design/*.md', 'design.md', 'docs/*.design*.md']);
  if (!doc) { check('design', '设计文档存在', 'FAIL', '未找到设计文档'); return; }
  check('design', '设计文档存在', 'PASS', path.basename(doc));
  check('design', '覆盖架构要素', grepHas(doc, '模块|接口|依赖|分层|架构|数据库|索引|迁移') ? 'PASS' : 'FAIL', '需含模块/接口/依赖等要素');
  check('design', '覆盖需求', 'SKIP', '人工核对设计是否覆盖所有需求点');
  const report = argVal('--report');
  if (report && fs.existsSync(report)) {
    check('design', '审查无 CRITICAL/HIGH', grepHas(report, 'CRITICAL|HIGH|阻断|严重') ? 'FAIL' : 'PASS', '审查报告中不得出现未修复的 CRITICAL/HIGH');
  } else {
    check('design', '审查无 CRITICAL/HIGH', 'SKIP', '提供 --report 审查报告可自动检查');
  }
}

// ---- code ----
const HARDCODED_SECRET_RE = /(ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{32,}|glpat-[A-Za-z0-9\-_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/;
function gateCode(dir) {
  const csproj = findGlob(dir, ['**/*.csproj']);
  if (!csproj) { check('code', '存在 .csproj 项目', 'FAIL', '未找到 *.csproj，无法编译验证'); return; }
  check('code', '存在 .csproj 项目', 'PASS', path.basename(csproj));
  // 扫硬编码密钥（跳过 evals/hooks 自身）
  let secretFound = false;
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (['node_modules', 'bin', 'obj', '.git', 'evals', 'scripts', 'hooks'].includes(e.name)) continue;
        walk(path.join(p, e.name));
      } else if (/\.(cs|js|ts|py|go|java)$/i.test(e.name)) {
        if (HARDCODED_SECRET_RE.test(fs.readFileSync(path.join(p, e.name), 'utf8'))) { secretFound = true; break; }
      }
    }
  };
  walk(dir);
  check('code', '无硬编码密钥', secretFound ? 'FAIL' : 'PASS');
  if (hasArg('--run-build')) {
    const b = run('dotnet build --configuration Release', dir);
    check('code', 'dotnet build 退出码=0', b.ok ? 'PASS' : 'FAIL', b.ok ? '' : b.out.split('\n').slice(-8).join(' ').slice(0, 200));
  } else {
    check('code', 'dotnet build 退出码=0', 'SKIP', '加 --run-build 自动跑编译');
  }
  const diff = argVal('--diff');
  if (diff && fs.existsSync(diff)) {
    const stat = fs.readFileSync(diff, 'utf8');
    const linesChanged = parseInt((stat.match(/(\d+)\s+insertion/)?.[1] || '0'), 10);
    const filesChanged = (stat.match(/files? changed/) ? parseInt(stat.split(' ')[0], 10) : 0);
    check('code', '深度审计触发判断', linesChanged > 100 || filesChanged > 5 ? 'SKIP' : 'PASS', `改 ${filesChanged} 文件/${linesChanged} 行`);
  } else {
    check('code', '深度审计触发判断', 'SKIP', '提供 --diff（git diff --stat 输出）可自动判断是否需深度审计');
  }
}

// ---- test ----
function gateTest(dir) {
  const testProj = findTestProj(dir);
  check('test', '测试项目存在', testProj ? 'PASS' : 'FAIL', testProj ? path.basename(testProj) : '未找到 *.Tests/*.Test 测试项目');
  const testFiles = findTestFile(dir);
  check('test', '测试文件存在', testFiles ? 'PASS' : 'FAIL', testFiles ? path.basename(testFiles) : '未找到测试文件');
  if (hasArg('--run-build')) {
    const t = run('dotnet test --no-build 2>&1 || dotnet test', dir);
    check('test', 'dotnet test 退出码=0', t.ok ? 'PASS' : 'FAIL', t.ok ? '' : t.out.split('\n').slice(-8).join(' ').slice(0, 200));
  } else {
    check('test', 'dotnet test 退出码=0', 'SKIP', '加 --run-build 自动跑测试');
  }
  check('test', '新增功能有对应测试', 'SKIP', '人工核对新增功能/修复 bug 是否有对应测试');
}

// ---- release ----
function gateRelease(dir) {
  const report = argVal('--report');
  if (report && fs.existsSync(report)) {
    check('release', '深度审计通过', grepHas(report, 'CRITICAL|HIGH|阻断') ? 'FAIL' : 'PASS', '审计报告不得含未修复 CRITICAL/HIGH');
  } else {
    check('release', '深度审计通过', 'SKIP', '提供 --report 审查报告可自动检查');
  }
  const cl = argVal('--changelog') || findFile(dir, ['CHANGELOG.md', 'docs/CHANGELOG.md']);
  if (cl) {
    check('release', '变更日志已更新', grepHas(cl, new Date().getFullYear()) ? 'PASS' : 'FAIL', 'CHANGELOG 需含本年度条目');
  } else {
    check('release', '变更日志已更新', 'FAIL', '未找到 CHANGELOG.md');
  }
  const rb = argVal('--rollback');
  if (rb) {
    check('release', '回滚方案明确', grepHas(rb, '回滚|rollback|restore|还原') ? 'PASS' : 'FAIL', '回滚文档需含回滚步骤');
  } else {
    check('release', '回滚方案明确', 'SKIP', '提供 --rollback 回滚文档可自动检查');
  }
  check('release', '变更范围/风险已评估', 'SKIP', '人工确认变更范围、数据/性能/安全风险');
}

// ---- main ----
const gateArg = process.argv[2];
const dir = argVal('--dir');
if (!dir || !fs.existsSync(dir)) { console.error('[eval-gates] 用法: eval-gates.mjs <gate|all> --dir <项目目录> …'); process.exit(3); }
const targets = gateArg === 'all' ? GATES : [gateArg];
if (gateArg && gateArg !== 'all' && !GATES.includes(gateArg)) { console.error(`[eval-gates] 未知门禁: ${gateArg}（可选: ${GATES.join('/')} 或 all）`); process.exit(3); }
if (!gateArg) { console.error('[eval-gates] 用法: eval-gates.mjs <gate|all> --dir <项目目录> …'); process.exit(3); }

for (const g of targets) {
  ({ requirement: gateRequirement, design: gateDesign, code: gateCode, test: gateTest, release: gateRelease })[g](dir);
}

// 汇总
let failed = 0, manual = 0;
console.log('\n=== Eval-Gates 结果 ===');
for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '👁';
  console.log(` ${icon} [${r.gate}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  if (r.status === 'FAIL') failed++;
  if (r.status === 'SKIP') manual++;
}
console.log(`\n汇总: ${results.length - failed - manual} PASS / ${failed} FAIL / ${manual} 人工项`);
process.exit(failed > 0 ? 1 : manual > 0 ? 2 : 0);
