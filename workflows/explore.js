// Workflow: 探索工作流
// 职责：需求沟通、需求澄清、技术调研、方案比较
// 输入：问题
// 输出：Requirement.md, Decision.md
//
// 引用 agents: Builder
// 引用 skills: requirements, arch-review
// 引用 rules: tools/code-access.md, quality/gates.md
//
// 预期行为: 3 阶段 — 需求探索 → 方案设计 → 决策记录
// 失败策略: 需求不清晰 → 返回 BLOCKED 要求补充信息
// 预计 token: ~40-80k

export const meta = {
  name: 'explore',
  description: '探索工作流 — 需求沟通、澄清、技术调研、方案比较',
  phases: [
    { title: '需求探索', detail: '5W1H 分析、需求质询、边界确认' },
    { title: '方案设计', detail: '技术调研、多方案对比、架构设计' },
    { title: '决策记录', detail: '记录决策理由、约束条件、验收标准' },
  ],
}

// Schema 定义
const REQUIREMENT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    background: { type: 'string' },
    stakeholders: { type: 'array', items: { type: 'string' } },
    functionalRequirements: { type: 'array', items: { type: 'string' } },
    nonFunctionalRequirements: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'functionalRequirements', 'acceptanceCriteria'],
}

const DESIGN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          pros: { type: 'array', items: { type: 'string' } },
          cons: { type: 'array', items: { type: 'string' } },
          effort: { type: 'string' },
          risk: { type: 'string' },
        },
      },
    },
    recommendation: { type: 'string' },
    recommendationReason: { type: 'string' },
  },
  required: ['title', 'options', 'recommendation'],
}

const DECISION_SCHEMA = {
  type: 'object',
  properties: {
    decision: { type: 'string' },
    rationale: { type: 'string' },
    alternatives: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
    nextSteps: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['decision', 'rationale'],
}

// ========== 入口 ==========
const question = args?.question
const context = args?.context
const domain = args?.domain

if (!question) throw new Error('缺少问题描述，请提供 question 参数')

log(`开始探索工作流：${question}`)

// ========== 阶段一：需求探索 ==========
phase('需求探索')

log('分析需求...')

const requirement = await agent(
  `分析以下需求，使用 5W1H 方法进行质询。

问题/需求：${question}
业务上下文：${context || '待补充'}
领域：${domain || '待确认'}

请执行：
1. 复述需求，确认理解是否正确
2. 使用 5W1H 分析：
   - WHO：谁在用？具体角色和场景
   - WHAT：要做什么？具体功能点
   - WHEN：什么时候用？触发条件
   - WHERE：在哪里用？系统边界
   - WHY：为什么要做？业务价值
   - HOW：怎么做？技术方向
3. 识别模糊点，提出澄清问题
4. 定义验收标准

输出完整的需求文档内容（Markdown 格式）。`,
  { label: '需求探索', phase: '需求探索', schema: REQUIREMENT_SCHEMA, agentType: 'Builder' }
)

// 检查是否有未解决的模糊点
if (requirement?.risks?.length > 0) {
  log('⚠️ 发现以下风险/模糊点：')
  requirement.risks.forEach(r => log(`  - ${r}`))
}

log('需求探索完成')

// ========== 阶段二：方案设计 ==========
phase('方案设计')

log('设计技术方案...')

const design = await agent(
  `基于以下需求，设计技术方案。

【需求文档】
标题：${requirement?.title}
功能需求：${requirement?.functionalRequirements?.join('\n- ')}
非功能需求：${requirement?.nonFunctionalRequirements?.join('\n- ')}
约束条件：${requirement?.constraints?.join('\n- ')}

请执行：
1. 调研现有代码库，了解相关模块和架构
2. 提出 2-3 个可行方案
3. 每个方案分析优缺点、工作量、风险
4. 给出推荐方案和理由

输出完整的设计文档内容（Markdown 格式）。`,
  { label: '方案设计', phase: '方案设计', schema: DESIGN_SCHEMA, agentType: 'Builder' }
)

log(`推荐方案：${design?.recommendation}`)
log(`推荐理由：${design?.recommendationReason}`)

// ========== 阶段三：决策记录 ==========
phase('决策记录')

log('记录决策...')

const decision = await agent(
  `记录本次需求探索的决策。

【需求】
${requirement?.title}
${requirement?.functionalRequirements?.join('\n- ')}

【推荐方案】
${design?.recommendation}
${design?.recommendationReason}

【其他方案】
${design?.options?.map(o => `- ${o.name}: ${o.description}`).join('\n')}

请输出决策记录，包含：
1. 最终决策
2. 决策理由
3. 考虑过的替代方案
4. 约束条件
5. 下一步行动
6. 待解决的问题`,
  { label: '决策记录', phase: '决策记录', schema: DECISION_SCHEMA, agentType: 'Builder' }
)

// 保存文档
const timestamp = new Date().toISOString().split('T')[0]
const slug = question.toLowerCase().replace(/\s+/g, '-').substring(0, 30)
const docDir = `docs/explore/${timestamp}-${slug}`

await Write(`${docDir}/requirement.md`, `# ${requirement?.title}

## 背景
${requirement?.background}

## 干系人
${requirement?.stakeholders?.join('\n- ')}

## 功能需求
${requirement?.functionalRequirements?.join('\n- ')}

## 非功能需求
${requirement?.nonFunctionalRequirements?.join('\n- ')}

## 约束条件
${requirement?.constraints?.join('\n- ')}

## 验收标准
${requirement?.acceptanceCriteria?.join('\n- ')}

## 风险
${requirement?.risks?.join('\n- ')}
`)

await Write(`${docDir}/decision.md`, `# 决策记录

## 决策
${decision?.decision}

## 理由
${decision?.rationale}

## 替代方案
${decision?.alternatives?.join('\n- ')}

## 约束条件
${decision?.constraints?.join('\n- ')}

## 下一步
${decision?.nextSteps?.join('\n- ')}

## 待解决问题
${decision?.openQuestions?.join('\n- ')}
`)

log(`文档已保存到 ${docDir}`)
log('探索工作流完成')

return {
  status: 'SUCCESS',
  requirement: {
    title: requirement?.title,
    functionalRequirements: requirement?.functionalRequirements,
    acceptanceCriteria: requirement?.acceptanceCriteria,
  },
  design: {
    recommendation: design?.recommendation,
    options: design?.options?.map(o => o.name),
  },
  decision: {
    decision: decision?.decision,
    nextSteps: decision?.nextSteps,
  },
  documentDir: docDir,
}
