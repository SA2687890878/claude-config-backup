// Workflow: 测试执行闭环（自动运行 → 分析 → 修复 → 验证）
// 对应 Skill: ~/.claude/skills/test-runner/SKILL.md
//
// 预期行为: 3 阶段顺序执行 — 执行测试 → 分析结果 → 失败修复循环
// 失败策略: 测试失败 → 逐个分析修复，最多循环 3 轮；编译失败 → 返回 BLOCKED
// 可跳过: 用户指定单个测试文件时可跳过全量运行
// 预计 token: ~30-60k
export const meta = {
  name: 'test-runner',
  description: '测试执行闭环 — 运行测试、分析失败、修复验证',
  phases: [
    { title: '执行测试', detail: '运行 dotnet test，捕获完整输出' },
    { title: '分析结果', detail: '解析测试数量、失败详情，分类 PASS/FAIL' },
    { title: '失败修复', detail: '逐个分析失败测试，定位根因，最小化修复' },
  ],
}

// 测试结果 schema
const TEST_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['PASS', 'FAIL', 'ERROR'] },
    total: { type: 'number' },
    passed: { type: 'number' },
    failed: { type: 'number' },
    skipped: { type: 'number' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testName: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          error: { type: 'string' },
          category: { type: 'string', enum: ['断言失败', '异常', '超时', '编译错误', '其他'] },
        },
        required: ['testName', 'error'],
      },
    },
    duration: { type: 'string' },
  },
  required: ['status', 'total', 'passed', 'failed'],
}

// 修复结果 schema
const FIX_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    testName: { type: 'string' },
    rootCause: { type: 'string' },
    fixApplied: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    retestPassed: { type: 'boolean' },
  },
  required: ['testName', 'rootCause', 'retestPassed'],
}

// === Phase 1: 执行测试 ===
phase('执行测试')

const testTarget = args?.project || args?.testProject || ''
const testFilter = args?.filter || ''

// 构建 dotnet test 命令
let testCmd = 'dotnet test --no-restore --verbosity normal'
if (testTarget) testCmd += ` "${testTarget}"`
if (testFilter) testCmd += ` --filter "${testFilter}"`

log(`运行: ${testCmd}`)

const testOutput = await agent(
  `运行以下命令并返回完整输出（不要截断，不要总结）：
\`\`\`bash
${testCmd}
\`\`\`

要求：
1. 返回命令的完整 stdout + stderr
2. 包含退出码
3. 不要分析、不要总结、不要省略任何行`,
  { label: 'test-executor', phase: '执行测试' }
)

// 检查是否编译失败（退出码非 0 且输出包含 "Build FAILED"）
if (testOutput && /Build FAILED|error CS\d+:/.test(testOutput)) {
  log('❌ 编译失败，无法运行测试')
  return {
    status: 'BLOCKED',
    reason: 'dotnet test 编译失败，请先修复编译错误',
    output: testOutput,
  }
}

// === Phase 2: 分析结果 ===
phase('分析结果')

const analysis = await agent(
  `分析以下 dotnet test 输出，提取测试结果：

${testOutput}

要求 JSON 格式：
{
  "status": "PASS" 或 "FAIL" 或 "ERROR",
  "total": 总测试数,
  "passed": 通过数,
  "failed": 失败数,
  "skipped": 跳过数,
  "failures": [
    {
      "testName": "完整测试名",
      "file": "文件路径（如有）",
      "line": 行号（如有），
      "error": "错误信息",
      "category": "断言失败|异常|超时|编译错误|其他"
    }
  ],
  "duration": "耗时"
}

注意：
- 如果输出为空或命令不存在，status 为 "ERROR"
- 如果所有测试通过（0 失败），status 为 "PASS"
- 逐个列出每个失败测试的完整信息
- category 根据错误信息判断：包含 "Assert" → 断言失败，包含 "Exception" → 异常，包含 "timeout" → 超时`,
  { label: 'test-analyzer', phase: '分析结果', schema: TEST_RESULT_SCHEMA }
)

if (!analysis || analysis.status === 'ERROR') {
  return {
    status: 'BLOCKED',
    reason: '无法解析测试输出，请检查测试项目配置',
    output: testOutput,
  }
}

// 全部通过 → 直接返回
if (analysis.status === 'PASS') {
  log(`✅ 全部 ${analysis.total} 个测试通过`)
  return {
    status: 'PASS',
    total: analysis.total,
    passed: analysis.passed,
    message: `全部 ${analysis.total} 个测试通过`,
  }
}

// 有失败 → 报告并进入修复
log(`⚠️ ${analysis.failed}/${analysis.total} 个测试失败，进入修复循环`)

// === Phase 3: 失败修复 ===
phase('失败修复')

if (!analysis.failures || analysis.failures.length === 0) {
  return {
    status: 'FAIL',
    total: analysis.total,
    passed: analysis.passed,
    failed: analysis.failed,
    message: `${analysis.failed} 个测试失败，但无法解析失败详情`,
    output: testOutput,
  }
}

// 限制最多修复 10 个失败（避免 token 爆炸）
const failuresToFix = analysis.failures.slice(0, 10)
const fixResults = []
let maxRounds = 3

for (let round = 0; round < maxRounds; round++) {
  log(`修复轮次 ${round + 1}/${maxRounds}，剩余 ${failuresToFix.length} 个失败`)

  const roundResults = await Promise.all(
    failuresToFix.map(failure => agent(
      `修复以下失败的测试：

测试名: ${failure.testName}
错误信息: ${failure.error}
${failure.file ? `文件: ${failure.file}` : ''}
${failure.line ? `行号: ${failure.line}` : ''}
分类: ${failure.category}

要求：
1. 先定位失败代码（用 search.ps1 或 Read 定位）
2. 分析根因（为什么失败）
3. 最小化修复（只改必须改的，不改测试来"凑绿"）
4. 修复后单独运行这个测试验证通过
5. 如果是测试本身的问题（如测试数据过期），说明原因而不是硬修

返回 JSON：
{
  "testName": "测试名",
  "rootCause": "根因分析",
  "fixApplied": "做了什么修复",
  "filesChanged": ["修改的文件列表"],
  "retestPassed": true/false
}`,
      { label: `fix:${failure.testName.substring(0, 30)}`, phase: '失败修复', schema: FIX_RESULT_SCHEMA }
    ))
  )

  // 收集结果
  for (const result of roundResults) {
    if (result) fixResults.push(result)
  }

  // 检查还有多少未修复
  const stillFailing = fixResults.filter(r => !r.retestPassed)
  if (stillFailing.length === 0) {
    log('✅ 所有失败测试已修复')
    break
  }

  // 更新待修复列表
  failuresToFix.length = 0
  failuresToFix.push(...stillFailing.map(r => ({
    testName: r.testName,
    error: `上次修复失败: ${r.rootCause}`,
    category: '其他',
  })))

  if (round === maxRounds - 1 && stillFailing.length > 0) {
    log(`⚠️ ${stillFailing.length} 个测试连续 ${maxRounds} 轮修复仍失败，停止修复`)
  }
}

// 最终验证：运行全量测试
log('运行全量回归测试...')
const finalTest = await agent(
  `运行以下命令并返回完整输出：
\`\`\`bash
${testCmd}
\`\`\`

只报告：总测试数、通过数、失败数、是否有新的失败。`,
  { label: 'final-verify', phase: '失败修复' }
)

const fixedCount = fixResults.filter(r => r.retestPassed).length
const unfixedCount = fixResults.filter(r => !r.retestPassed).length

return {
  status: unfixedCount === 0 ? 'PASS' : 'CONDITIONAL',
  total: analysis.total,
  passed: analysis.passed,
  failed: analysis.failed,
  fixed: fixedCount,
  unfixed: unfixedCount,
  fixDetails: fixResults,
  message: unfixedCount === 0
    ? `全部测试已修复并通过（修复了 ${fixedCount} 个）`
    : `修复了 ${fixedCount} 个，仍有 ${unfixedCount} 个失败需要人工处理`,
}
