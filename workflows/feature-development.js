// Workflow: 机器可执行的多阶段编排（自动调度 agents 并行工作）
// 对应 Command: ~/.claude/commands/feature-development.md（人类可读流程文档）
//
// 预期行为: 4 阶段流水线 — 文档生成(prompt-chaining 按依赖顺序) → 架构审查 → 代码审查(隔离 diff) → 完成验证(确定性退出码 gate)
// 失败策略: 文档/审查/验证任一关键步失败 → 返回 BLOCKED 交人工决策，绝不写占位内容继续(fail-loud)
// 可跳过: 无代码变更时可跳过"代码审查"阶段
// 预计 token: ~80-150k（取决于代码变更量）
export const meta = {
  name: 'feature-development',
  description: '功能开发完整工作流 — 自动生成文档、架构审查、代码审查、完成验证',
  phases: [
    { title: '文档生成', detail: '并行生成需求、分析、设计文档' },
    { title: '架构审查', detail: '审查技术方案和架构影响' },
    { title: '代码审查', detail: '审查代码质量和规范' },
    { title: '完成验证', detail: '验证功能完整性' },
  ],
}

// 文档输出 schema
const DOC_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    content: { type: 'string' },
    filename: { type: 'string' },
  },
  required: ['title', 'content', 'filename'],
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
const featureName = args?.featureName
const featureDescription = args?.featureDescription

if (!featureName) throw new Error('缺少功能名称，请提供 featureName 参数')

log(`开始功能开发工作流：${featureName}`)

// ========== 阶段一：生成文档（prompt-chaining，按依赖顺序） ==========
// 官方依据：Parallelization 仅适用「独立子任务」；
// 需求/分析/设计/任务是递进依赖关系，应走 prompt chaining，下游消费上游产出。
phase('文档生成')

// 1) 需求 + 分析：都只依赖原始描述，互不依赖 → 可并行（sectioning）
log('并行生成需求 + 分析文档...')
const [requirement, analysis] = await parallel([
  () => agent(
    `你是需求分析师。分析以下功能并生成需求文档。

功能名称：${featureName}
功能描述：${featureDescription}

使用 5 问质询法分析需求，输出完整的需求文档内容（Markdown 格式）。
包含：基本信息、需求描述、使用者、功能要求、验收标准、约束条件。`,
    { label: '需求文档', phase: '文档生成', schema: DOC_SCHEMA }
  ),
  () => agent(
    `你是需求分析师。分析以下功能的边界和异常场景。

功能名称：${featureName}
功能描述：${featureDescription}

输出完整的需求分析文档内容（Markdown 格式）。
包含：功能边界、异常场景、数据流、API 设计、权限设计。`,
    { label: '需求分析', phase: '文档生成', schema: DOC_SCHEMA }
  ),
])

// fail-loud：上游缺失直接中断，绝不用占位符继续
if (!requirement?.content || !analysis?.content) {
  return {
    status: 'BLOCKED',
    reason: '需求/分析文档生成失败，已中断（避免写入占位垃圾文档）',
    partial: { requirement, analysis },
  }
}

// 2) 设计：依赖需求 + 分析 → 链式，消费上游真实产出
log('基于需求+分析生成设计文档...')
const design = await agent(
  `你是架构师。基于已确认的需求与分析，为以下功能设计技术方案。

功能名称：${featureName}

【需求文档】
${requirement.content}

【需求分析】
${analysis.content}

使用 codegraph_explore 分析现有代码结构，输出完整的详细设计文档内容（Markdown 格式）。
包含：技术方案、代码变更、数据库变更、依赖影响、风险评估。
设计必须与上述需求/分析保持一致。`,
  { label: '架构设计', phase: '文档生成', schema: DOC_SCHEMA }
)

if (!design?.content) {
  return {
    status: 'BLOCKED',
    reason: '设计文档生成失败，已中断',
    partial: { requirement, analysis },
  }
}

// 3) 任务：依赖设计 → 链式
log('基于设计生成任务清单...')
const tasks = await agent(
  `你是项目经理。基于以下设计方案，为功能拆分开发任务。

功能名称：${featureName}

【详细设计】
${design.content}

输出完整的任务清单文档内容（Markdown 格式）。
包含：数据库任务、后端任务、前端任务、测试任务、文档任务、依赖关系、里程碑。
任务必须可追溯到设计中的每一项变更。`,
  { label: '任务拆分', phase: '文档生成', schema: DOC_SCHEMA }
)

if (!tasks?.content) {
  return {
    status: 'BLOCKED',
    reason: '任务清单生成失败，已中断',
    partial: { requirement, analysis, design },
  }
}

log('文档生成完成，保存到文件...')

const featureDir = `docs/features/${featureName}`
await agent(
  `创建目录 ${featureDir} 并保存以下文档：

1. 01-requirement.md：
${requirement.content}

2. 02-analysis.md：
${analysis.content}

3. 03-design.md：
${design.content}

4. 04-tasks.md：
${tasks.content}

使用 Write 工具保存每个文件。`,
  { label: '保存文档', phase: '文档生成' }
)

log('文档已保存到 ' + featureDir)

// ========== 阶段二：架构审查 ==========
phase('架构审查')

log('开始架构审查...')

const archReview = await agent(
  `你是工程经理，审查以下技术方案。

功能名称：${featureName}
设计文档：
${design.content}

按照以下维度审查：
1. 分层与依赖 — 依赖方向是否正确
2. .NET 架构 — DI、异步、接口设计
3. 数据访问 — N+1、事务、连接管理
4. API 设计 — RESTful、错误处理

【审查纪律】只报会影响正确性、可维护性或明确需求的问题。
不要报风格偏好、不要为「凑数」制造发现。若方案合理就直接判 PASS。
输出审查报告，包含：状态（PASS/FAIL/CONDITIONAL）、发现列表、总结。`,
  { label: '架构审查', phase: '架构审查', schema: REVIEW_SCHEMA }
)

if (archReview?.status === 'FAIL') {
  log('⚠️ 架构审查未通过，请检查发现的问题')
  return { status: 'BLOCKED', reason: '架构审查未通过', findings: archReview.findings }
}

log('架构审查完成：' + archReview?.status)

// ========== 阶段三：代码审查 ==========
// 官方依据：审查者在「fresh context 只看 diff + 标准」，与产出代码的推理隔离
phase('代码审查')

log('开始代码审查（隔离上下文，仅基于 git diff）...')

const codeReview = await agent(
  `你是 Staff Engineer，在独立上下文中审查本次代码变更。

第一步：运行 \`git diff\`（必要时 \`git diff --staged\`）获取本次真实变更。
你只依据 diff 本身审查，不要假设 diff 之外的内容。

审查标准（功能：${featureName}）：
1. 命名规范 — 是否符合项目约定
2. 代码质量 — 单一职责、方法长度
3. 异常处理 — 空 catch、资源泄漏
4. 性能问题 — N+1、大数据查询、.Result/.Wait() 阻塞
5. 安全问题 — SQL 注入、硬编码密钥、敏感信息日志
6. 多租户 — ComId 是否正确处理

【审查纪律】只报会影响正确性、安全或明确需求的问题。
不要报风格偏好，不要因为「被要求找问题」而过度报告导致过度工程。
若变更正确就直接判 PASS。
输出审查报告，包含：状态（PASS/FAIL/CONDITIONAL）、发现列表、总结。`,
  { label: '代码审查', phase: '代码审查', schema: REVIEW_SCHEMA }
)

if (codeReview?.status === 'FAIL') {
  log('⚠️ 代码审查未通过，请检查发现的问题')
  return { status: 'BLOCKED', reason: '代码审查未通过', findings: codeReview.findings }
}

log('代码审查完成：' + codeReview?.status)

// ========== 阶段四：完成验证（确定性 gate） ==========
// 官方依据：「Give Claude a way to verify its work」— 验证必须基于确定性信号（build/test 退出码）
phase('完成验证')

log('运行确定性验证（读取真实退出码）...')

const verification = await agent(
  `你是验证执行器。你的职责是「运行命令并如实回报真实退出码」，不是凭感觉判断。

严格按顺序执行，并记录每条命令的真实退出码（exit code）：
1. \`dotnet build --configuration Release\` → 记录退出码
2. \`dotnet test\` → 记录退出码与「通过/失败/跳过」数量
3. \`git diff --stat\` → 记录变更文件清单

判定规则（确定性，不允许主观放宽）：
- 仅当 build 退出码 == 0 且 test 退出码 == 0 时，status = PASS
- 任一退出码 != 0，status = FAIL，并在 findings 中附上真实报错输出原文

不要在未实际运行命令的情况下声称成功。必须给出你实际运行的命令与其返回内容作为证据。
输出报告，包含：状态（PASS/FAIL）、各命令退出码与证据、总结。`,
  { label: '完成验证', phase: '完成验证', schema: REVIEW_SCHEMA }
)

if (verification?.status !== 'PASS') {
  log('⚠️ 完成验证未通过（build/test 退出码非 0）')
  return { status: 'BLOCKED', reason: '完成验证未通过', findings: verification?.findings }
}

log('完成验证通过（build/test 退出码均为 0）')
log('功能开发工作流完成')

return {
  status: 'SUCCESS',
  feature: featureName,
  documents: {
    requirement: requirement?.content,
    analysis: analysis?.content,
    design: design?.content,
    tasks: tasks?.content,
  },
  reviews: {
    architecture: archReview,
    code: codeReview,
    verification: verification,
  },
}
