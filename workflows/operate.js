// Workflow: 运维工作流
// 职责：问题排查、日志分析、SQL分析、性能分析、根因分析
// 输入：故障
// 输出：RCA.md, Improvement.md
//
// 引用 agents: Operator
// 引用 skills: systematic-debugging, perf-tune, sql-best-practices
// 引用 rules: tools/code-access.md, quality/verification.md, quality/gates.md
//
// 预期行为: 4 阶段 — 问题定位 → 根因分析 → 修复实施 → 验证闭环
// 失败策略: 定位失败 → 输出已知信息，请求用户提供更多线索；验证 FAIL → 返回 BLOCKED
// 预计 token: ~60-120k

export const meta = {
  name: 'operate',
  description: '运维工作流 — 问题排查、日志分析、SQL分析、性能分析',
  phases: [
    { title: '问题定位', detail: '收集信息、复现问题、定位代码' },
    { title: '根因分析', detail: '分析代码逻辑、数据流、异常场景' },
    { title: '修复实施', detail: '实施修复、TDD验证' },
    { title: '验证闭环', detail: '编译测试、回归验证、文档记录' },
  ],
}

// Schema 定义
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

const PERF_SCHEMA = {
  type: 'object',
  properties: {
    target: { type: 'string' },
    metrics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          unit: { type: 'string' },
        },
      },
    },
    bottleneck: { type: 'string' },
    bottleneckType: { type: 'string', enum: ['数据库查询', '代码逻辑', 'N+1查询', '内存泄漏', '并发阻塞', 'IO阻塞', '缓存缺失'] },
    rootCause: { type: 'string' },
    optimizationPlan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          expectedGain: { type: 'string' },
          risk: { type: 'string' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
        },
      },
    },
  },
  required: ['target', 'bottleneck', 'bottleneckType'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['PASS', 'FAIL', 'CONDITIONAL'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
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
// 兼容多种调用方式：对象参数、字符串参数、数组参数
let issueTitle = args?.issueTitle
const issueDescription = args?.issueDescription
const errorLog = args?.errorLog
const issueType = args?.type || 'bug' // bug | performance | data
const today = args?.today || new Date().toISOString().split('T')[0]

if (!issueTitle && typeof args === 'string' && args.trim()) {
  issueTitle = args.trim()
}
if (!issueTitle && Array.isArray(args) && args.length > 0) {
  issueTitle = args.filter(a => typeof a === 'string').join(' ').trim()
}

if (!issueTitle) throw new Error('缺少问题标题，请提供 issueTitle 参数。用法：/operate <问题描述>')

log(`开始运维工作流：${issueTitle}`)
log(`问题类型：${issueType}`)

// ========== 阶段一：问题定位 ==========
phase('问题定位')

log('收集问题信息...')

// 根据问题类型选择不同的分析策略
let issueInfo, codeLocation

if (issueType === 'performance') {
  // 性能问题分析
  log('执行性能分析...')

  const perfAnalysis = await agent(
    `分析以下性能问题。

问题标题：${issueTitle}
问题描述：${issueDescription || '待分析'}
错误日志：${errorLog || '无'}

请执行：
1. 分析相关代码结构和调用链
2. 检查数据库查询（N+1、全表扫描、缺少索引）
3. 检查代码逻辑（同步阻塞、大对象、资源泄漏）
4. 检查缓存策略

输出：
1. 性能指标基线
2. 瓶颈类型和位置
3. 根本原因分析
4. 优化方案`,
    { label: '性能分析', phase: '问题定位', schema: PERF_SCHEMA, agentType: 'Operator' }
  )

  issueInfo = {
    title: issueTitle,
    description: issueDescription,
    severity: 'P1',
    category: '性能问题',
    expectedBehavior: '性能达标',
    actualBehavior: perfAnalysis?.bottleneck,
  }

  codeLocation = perfAnalysis?.bottleneck

  log(`瓶颈类型：${perfAnalysis?.bottleneckType}`)
  log(`瓶颈位置：${perfAnalysis?.bottleneck}`)

} else if (issueType === 'data') {
  // 数据问题分析
  log('执行数据分析...')

  const dataAnalysis = await agent(
    `分析以下数据问题。

问题标题：${issueTitle}
问题描述：${issueDescription || '待分析'}
错误日志：${errorLog || '无'}

请执行：
1. 分析数据流和数据来源
2. 检查 SQL 查询和数据转换
3. 检查数据一致性
4. 检查并发和事务问题

输出问题定位和根因分析。`,
    { label: '数据分析', phase: '问题定位', agentType: 'Operator' }
  )

  issueInfo = {
    title: issueTitle,
    description: issueDescription,
    severity: 'P1',
    category: '数据问题',
    expectedBehavior: '数据正确',
    actualBehavior: dataAnalysis,
  }

} else {
  // Bug 分析（默认）
  log('执行 Bug 分析...')

  issueInfo = await agent(
    `问题标题：${issueTitle}
问题描述：${issueDescription || '待补充'}
错误日志：${errorLog || '无'}

请分析并输出：
1. 问题分类（功能缺陷/性能问题/数据问题/接口问题/环境问题）
2. 严重程度（P0-P3）
3. 可能的复现步骤
4. 预期行为 vs 实际行为`,
    { label: '问题收集', phase: '问题定位', schema: ISSUE_SCHEMA, agentType: 'Operator' }
  )

  log(`问题分类：${issueInfo?.category}，严重程度：${issueInfo?.severity}`)

  log('定位问题代码...')

  codeLocation = await agent(
    `问题信息：
- 标题：${issueTitle}
- 描述：${issueDescription}
- 错误日志：${errorLog || '无'}

请定位问题可能所在的文件和函数，分析调用链路。`,
    { label: '代码定位', phase: '问题定位', agentType: 'Operator' }
  )
}

log('问题定位完成')

// ========== 阶段二：根因分析 ==========
phase('根因分析')

log('分析问题根因...')

const rootCause = await agent(
  `问题信息：
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
5. 有什么风险？`,
  { label: '根因分析', phase: '根因分析', schema: ROOT_CAUSE_SCHEMA, agentType: 'Operator' }
)

log(`根因：${rootCause?.rootCause?.substring(0, 100)}...`)
log(`修复策略：${rootCause?.fixStrategy}`)

// ========== 阶段三：修复实施 ==========
phase('修复实施')

log('实施修复...')

// TDD 第 1 步：编写失败测试
log('TDD 第 1 步：编写复现该 bug 的失败测试...')

const failingTest = await agent(
  `问题信息：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}
- 期望行为：在修复前该测试必须失败（红），因为它精确捕捉了 bug 的错误行为。

要求：
1. 测试要针对根因，断言「正确行为」，使得当前有 bug 的代码会让它失败
2. 遵循项目测试约定（测试框架、命名、目录）
3. 运行该测试，确认它当前确实失败`,
  { label: 'TDD-失败测试', phase: '修复实施', agentType: 'Operator' }
)

// TDD 第 2 步：实施修复
log('TDD 第 2 步：实施修复，使失败测试转绿...')

const fixResult = await agent(
  `问题信息：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}
- 修复策略：${rootCause?.fixStrategy}
- 影响文件：${rootCause?.affectedFiles?.join(', ')}

修复要求：
1. 按修复策略实施代码变更，针对根因而非症状
2. 处理边界情况和异常场景，确保不引入新问题
3. 遵循项目代码规范
4. 不得修改测试来「迁就」错误行为；测试转绿必须靠真正修复`,
  { label: '修复实施', phase: '修复实施', agentType: 'Operator' }
)

log('修复代码完成')

// ========== 阶段四：验证闭环 ==========
phase('验证闭环')

// 编译测试验证
log('确定性验证：编译 + 测试（读取真实退出码）...')

const buildResult = await agent(
  `验证要求：
1. 运行 dotnet build，记录退出码
2. 运行 dotnet test，记录退出码与通过/失败数量
3. 确认复现测试已转绿（由红→绿），检查是否有回归

判定规则：
- 仅当 build 退出码 == 0 且 test 退出码 == 0 且复现测试已通过且无回归时，status = PASS
- 任一条件不满足，status = FAIL`,
  { label: '编译测试验证', phase: '验证闭环', schema: REVIEW_SCHEMA, agentType: 'Operator' }
)

if (buildResult?.status !== 'PASS') {
  log('⚠️ 编译/测试验证未通过')
  return { status: 'BLOCKED', reason: '编译/测试验证未通过', findings: buildResult?.findings }
}

log('编译 + 测试验证通过')

// 代码审查
log('代码审查（隔离上下文，仅基于 git diff）...')

const codeReview = await agent(
  `第一步：运行 git diff 获取本次真实变更，只依据 diff 本身审查。

审查标准：
- 标题：${issueTitle}
- 根因：${rootCause?.rootCause}

1. 修复是否真正解决根因（而非掩盖症状）
2. 是否有遗漏的边界情况
3. 是否引入新问题
4. 是否存在安全问题`,
  { label: '代码审查', phase: '验证闭环', schema: REVIEW_SCHEMA, agentType: 'Operator' }
)

if (codeReview?.status === 'FAIL') {
  log('⚠️ 代码审查未通过')
  return { status: 'BLOCKED', reason: '代码审查未通过', findings: codeReview.findings }
}

log('代码审查完成：' + codeReview?.status)

// 生成排查文档（RCA Artifact）
log('生成 RCA 文档...')

const timestamp = new Date().toISOString().split('T')[0]
const issueSlug = issueTitle?.toLowerCase().replace(/[^\w一-龥]+/g, '-').substring(0, 30) || 'issue'
const artifactDir = `.claude/artifacts`
const rcaFile = `${artifactDir}/RCA-${timestamp}-${issueSlug}.md`

// 确保目录存在（用 Bash 工具更可靠）
try {
  await agent('mkdir -p .claude/artifacts 2>/dev/null || true', { label: '创建目录', phase: '验证闭环' })
} catch (e) {
  log('⚠️ 创建目录失败，将尝试直接写入')
}

await Write(rcaFile, `# RCA: ${issueTitle || '问题排查'}

## 问题信息
- 分类：${issueInfo?.category || '待分类'}
- 严重程度：${issueInfo?.severity || 'P2'}
- 发现时间：${timestamp}

## 问题描述
${issueDescription || '待补充'}

## 复现步骤
${issueInfo?.reproduceSteps?.length > 0 ? issueInfo.reproduceSteps.map((step, i) => `${i+1}. ${step}`).join('\n') : '待补充'}

## 根因分析
${rootCause?.rootCause || '待分析'}

## 修复方案
${rootCause?.fixStrategy || '待确定'}

## 影响范围
**影响文件：**
${rootCause?.affectedFiles?.length > 0 ? '\n- ' + rootCause.affectedFiles.join('\n- ') : '无'}

**影响函数：**
${rootCause?.affectedFunctions?.length > 0 ? '\n- ' + rootCause.affectedFunctions.join('\n- ') : '无'}

## 预防措施
${rootCause?.risks?.length > 0 ? rootCause.risks.join('\n- ') : '无'}

## 验证结果
- 编译：${buildResult?.status || '未验证'}
- 测试：${testResult?.status || '未验证'}
- 审查：${codeReview?.status || '未审查'}

## 改进建议
- 增加相关场景的单元测试
- 完善错误处理
- 更新相关文档
`)

log(`RCA 文档已保存到 ${rcaFile}`)
log('运维工作流完成 — RCA.md 已生成')

return {
  status: 'SUCCESS',
  artifacts: {
    rca: rcaFile,
  },
  issue: issueTitle,
  category: issueInfo?.category,
  severity: issueInfo?.severity,
  rootCause: rootCause?.rootCause,
  fixStrategy: rootCause?.fixStrategy,
  affectedFiles: rootCause?.affectedFiles,
  reviews: {
    build: buildResult?.status,
    code: codeReview?.status,
  },
  document: docPath,
}
