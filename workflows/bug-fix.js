// Workflow: 机器可执行的多阶段编排（自动调度 agents 并行工作）
// 对应 Command: ~/.claude/commands/bug-fix.md（人类可读流程文档）
//
// 预期行为: 4 阶段顺序执行 — 问题定位 → 根因分析 → 修复实施(TDD:先写复现失败测试) → 验证审查(确定性退出码 gate)
// 失败策略: 定位失败 → 输出已知信息，请求用户提供更多线索；验证/审查 FAIL → 返回 BLOCKED 交人工决策
// 可跳过: 用户已知根因时可跳过"问题定位"和"根因分析"
// 预计 token: ~50-100k
export const meta = {
  name: 'bug-fix',
  description: 'Bug 修复工作流 — 系统化定位问题、分析根因、修复验证',
  phases: [
    { title: '问题定位', detail: '收集信息、复现问题、定位代码' },
    { title: '根因分析', detail: '分析代码逻辑、数据流、异常场景' },
    { title: '修复实施', detail: 'TDD：先写复现失败测试，再修复使其转绿' },
    { title: '验证审查', detail: '编译测试、代码审查、完成验证' },
  ],
}

// 问题信息 schema
const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
    category: { type: 'string', enum: ['功能缺陷', '性能问题', '数据问题', '接口问题', '环境问题'] },
    reproduceSteps: { type: 'array', items: { type: 'string' } },
    expectedBehavior: { type: 'string' },
    actualBehavior: { type: 'string' },
  },
  required: ['title', 'description', 'severity', 'category'],
}

// 根因分析 schema
const ROOT_CAUSE_SCHEMA = {
  type: 'object',
  properties: {
    rootCause: { type: 'string' },
    affectedFiles: { type: 'array', items: { type: 'string' } },
    affectedFunctions: { type: 'array', items: { type: 'string' } },
    dataFlow: { type: 'string' },
    fixStrategy: { type: 'string' },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['rootCause', 'fixStrategy'],
}

// 审查结果 schema
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['PASS', 'FAIL', 'CONDITIONAL'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          description: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
  required: ['status', 'summary'],
}

// ========== 入口 ==========
// args.today 由调用方传入（workflow 脚本内禁止 new Date()）
const issueTitle = args?.issueTitle
const issueDescription = args?.issueDescription
const errorLog = args?.errorLog
const today = args?.today || 'unknown-date'

if (!issueTitle) throw new Error('缺少问题标题，请提供 issueTitle 参数')

log(`开始 Bug 修复工作流：${issueTitle}`)

// ========== 阶段一：问题定位 ==========
phase('问题定位')

log('收集问题信息...')

const issueInfo = await agent(
  `你是调试专家，收集和分析问题信息。

问题标题：${issueTitle}
问题描述：${issueDescription || '待补充'}
错误日志：${errorLog || '无'}

请分析并输出：
1. 问题分类（功能缺陷/性能问题/数据问题/接口问题/环境问题）
2. 严重程度（P0-P3）
3. 可能的复现步骤
4. 预期行为 vs 实际行为

使用 codegraph_explore 分析相关代码结构。`,
  { label: '问题收集', phase: '问题定位', schema: ISSUE_SCHEMA }
)

log(`问题分类：${issueInfo?.category}，严重程度：${issueInfo?.severity}`)

log('定位问题代码...')

const codeLocation = await agent(
  `你是调试专家，定位问题代码位置。

问题信息：
- 标题：${issueTitle}
- 描述：${issueDescription}
- 错误日志：${errorLog || '无'}

使用以下工具定位问题：
1. codegraph_explore — 分析相关代码结构
2. codegraph_search — 搜索相关函数和类
3. Grep — 搜索错误信息关键词

输出：
1. 问题可能所在的文件和函数
2. 调用链路
3. 关键代码片段`,
  { label: '代码定位', phase: '问题定位' }
)

log('问题定位完成')

// ========== 阶段二：根因分析 ==========
phase('根因分析')

log('分析问题根因...')

const rootCause = await agent(
  `你是调试专家，分析问题根本原因。

问题信息：
- 标题：${issueTitle}
- 分类：${issueInfo?.category}
- 描述：${issueDescription}

代码定位结果：
${codeLocation || '待分析'}

请分析：
1. 根本原因是什么？
2. 影响哪些文件和函数？
3. 数据流是怎样的？
4. 修复策略是什么？
5. 有什么风险？

使用 codegraph_explore 分析代码逻辑和依赖关系。`,
  { label: '根因分析', phase: '根因分析', schema: ROOT_CAUSE_SCHEMA }
)

log(`根因：${rootCause?.rootCause?.substring(0, 100)}...`)
log(`修复策略：${rootCause?.fixStrategy}`)

// ========== 阶段三：修复实施（TDD：先写复现失败测试） ==========
// 官方依据：Best practices — "write a failing test that reproduces the issue, then fix it"
// 先用测试锁定 bug（红），再修复使其转绿，得到可回归的确定性信号
phase('修复实施')

log('TDD 第 1 步：编写复现该 bug 的失败测试...')

const failingTest = await agent(
  `你是测试工程师，按 TDD 为本次 bug 编写一个「复现问题」的失败测试。

问题信息：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}
- 期望行为：在修复前该测试必须失败（红），因为它精确捕捉了 bug 的错误行为。

要求：
1. 测试要针对根因，断言「正确行为」，使得当前有 bug 的代码会让它失败
2. 遵循项目测试约定（测试框架、命名、目录）
3. 运行该测试，确认它当前确实失败，并附上真实失败输出作为证据

输出：测试文件路径、测试方法名、当前运行结果（必须为失败/红）。`,
  { label: 'TDD-失败测试', phase: '修复实施' }
)

log('TDD 第 2 步：实施修复，使失败测试转绿...')

const fixResult = await agent(
  `你是实现者，实施 Bug 修复，使上一步的失败测试转为通过。

问题信息：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}
- 修复策略：${rootCause?.fixStrategy}
- 影响文件：${rootCause?.affectedFiles?.join(', ')}
- 已写的失败测试：${failingTest || '（见上一步）'}

修复要求：
1. 按修复策略实施代码变更，针对根因而非症状
2. 处理边界情况和异常场景，确保不引入新问题
3. 遵循项目代码规范
4. 不得修改测试来「迁就」错误行为；测试转绿必须靠真正修复

输出：
1. 修改的文件列表
2. 每个文件的变更说明`,
  { label: '修复实施', phase: '修复实施' }
)

log('修复代码完成')

// ========== 阶段四：验证审查 ==========
// 官方依据：验证基于可返回 pass/fail 的确定性信号（build/test 退出码），而非 agent 自述
phase('验证审查')

log('确定性验证：编译 + 测试（读取真实退出码）...')

const buildResult = await agent(
  `你是验证执行器，职责是「运行命令并如实回报真实退出码」，不得凭感觉判断。

严格按顺序执行并记录每条命令的真实退出码（exit code）：
1. \`dotnet build\` → 记录退出码
2. \`dotnet test\` → 记录退出码；确认上一步新写的复现测试现在已转绿（通过）

判定规则（确定性）：
- 仅当 build 退出码 == 0 且 test 退出码 == 0 且复现测试已通过时，status = PASS
- 任一条件不满足，status = FAIL，并在 findings 附真实报错/失败输出原文

不要在未实际运行命令的情况下声称成功，必须给出实际运行的命令与返回内容作为证据。
输出：状态（PASS/FAIL）、各命令退出码与证据、总结。`,
  { label: '编译测试验证', phase: '验证审查', schema: REVIEW_SCHEMA }
)

if (buildResult?.status !== 'PASS') {
  log('⚠️ 编译/测试验证未通过（退出码非 0 或复现测试未转绿）')
  return { status: 'BLOCKED', reason: '编译/测试验证未通过', findings: buildResult?.findings }
}

log('编译 + 测试验证通过')
log('代码审查（隔离上下文，仅基于 git diff）...')

const codeReview = await agent(
  `你是 Staff Engineer，在独立上下文中审查本次 Bug 修复。

第一步：运行 \`git diff\` 获取本次真实变更，只依据 diff 本身审查。

审查标准：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}
1. 修复是否真正解决根因（而非掩盖症状）
2. 是否有遗漏的边界情况
3. 是否引入新问题（含多租户 ComId、异步 .Result/.Wait()）
4. 是否存在 SQL 注入、硬编码密钥等安全问题

【审查纪律】只报会影响正确性、安全或明确需求的问题；不报风格偏好，
不为「凑数」过度报告导致过度工程。修复正确就判 PASS。
输出审查报告，包含：状态（PASS/FAIL/CONDITIONAL）、发现列表、总结。`,
  { label: '代码审查', phase: '验证审查', schema: REVIEW_SCHEMA }
)

if (codeReview?.status === 'FAIL') {
  log('⚠️ 代码审查未通过，请检查发现的问题')
  return { status: 'BLOCKED', reason: '代码审查未通过', findings: codeReview.findings }
}

log('代码审查完成：' + codeReview?.status)
log('完成验证...')

const verification = await agent(
  `你是最终验证执行器，确认 Bug 已修复且无回归 —— 以确定性信号为准。

问题信息：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}

执行并记录真实退出码：
1. \`dotnet test\` → 全部测试退出码必须为 0（含本次新写的复现测试）
2. 确认复现测试由「红→绿」，即 bug 已被真正修复
3. 检查是否有此前通过、现在失败的测试（回归）

判定（确定性）：
- 仅当 test 退出码 == 0 且无回归时 status = PASS
- 否则 status = FAIL，并附真实失败输出

不要在未运行测试的情况下声称通过，必须附证据。
输出验证报告，包含：状态（PASS/FAIL）、退出码与证据、总结。`,
  { label: '完成验证', phase: '验证审查', schema: REVIEW_SCHEMA }
)

if (verification?.status !== 'PASS') {
  log('⚠️ 完成验证未通过（测试退出码非 0 或存在回归）')
  return { status: 'BLOCKED', reason: '完成验证未通过', findings: verification?.findings }
}

log('验证通过（测试退出码为 0，复现测试已转绿）')

// ========== 生成排查文档 ==========
log('生成排查文档...')

const issueSlug = issueTitle.toLowerCase().replace(/\s+/g, '-').substring(0, 30)
const docPath = `docs/issues/${today}-${issueSlug}.md`

await agent(
  `生成问题排查文档并使用 Write 工具保存。

文档路径：${docPath}

内容（Markdown 格式）：
# ${issueTitle}

## 问题信息
- 分类：${issueInfo?.category}
- 严重程度：${issueInfo?.severity}
- 发现时间：${today}

## 问题描述
${issueDescription}

## 根因分析
${rootCause?.rootCause}

## 修复方案
${rootCause?.fixStrategy}

## 影响范围
${rootCause?.affectedFiles?.join('\n') || '无'}

## 预防措施
${rootCause?.risks?.join('\n') || '无'}

## 排查过程
1. 问题定位
2. 根因分析
3. TDD 修复（先写复现测试，再使其转绿）
4. 验证通过`,
  { label: '生成文档', phase: '验证审查' }
)

log(`排查文档已保存到 ${docPath}`)
log('Bug 修复工作流完成')

return {
  status: 'SUCCESS',
  issue: issueTitle,
  rootCause: rootCause?.rootCause,
  fixStrategy: rootCause?.fixStrategy,
  affectedFiles: rootCause?.affectedFiles,
  reviews: {
    code: codeReview,
    verification: verification,
  },
  document: docPath,
}
