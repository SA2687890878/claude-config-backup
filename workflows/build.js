// Workflow: 构建工作流
// 职责：架构设计、功能设计、数据库设计、编码、测试
// 输入：Requirement
// 输出：Architecture.md, Design.md, Code, TestPlan.md
//
// 引用 agents: Builder
// 引用 skills: dev-workflow, code-review-workflow, generate-tests, test-runner
// 引用 rules: tools/code-access.md, quality/review-checklist.md, quality/verification.md, quality/gates.md
//
// 预期行为: 5 阶段 — 架构设计 → 详细设计 → 编码实现 → 代码审查 → 测试验证
// 失败策略: 任一关键步失败 → 返回 BLOCKED
// 预计 token: ~100-200k

export const meta = {
  name: 'build',
  description: '构建工作流 — 架构设计、功能设计、数据库设计、编码、测试',
  phases: [
    { title: '架构设计', detail: '技术方案、模块划分、依赖分析' },
    { title: '详细设计', detail: 'API设计、数据库设计、接口定义' },
    { title: '编码实现', detail: '按设计文档实现代码' },
    { title: '代码审查', detail: '多维度审查代码质量' },
    { title: '测试验证', detail: '编译测试、回归验证' },
  ],
}

// Schema 定义
const ARCHITECTURE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    modules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          responsibility: { type: 'string' },
          dependencies: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    dataFlow: { type: 'string' },
    techStack: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'modules'],
}

const DESIGN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    apiDesign: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          endpoint: { type: 'string' },
          method: { type: 'string' },
          description: { type: 'string' },
          request: { type: 'string' },
          response: { type: 'string' },
        },
      },
    },
    databaseDesign: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          table: { type: 'string' },
          columns: { type: 'array', items: { type: 'string' } },
          indexes: { type: 'array', items: { type: 'string' } },
          relations: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    interfaceDesign: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          methods: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
        },
      },
    },
  },
  required: ['title'],
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
          file: { type: 'string' },
          line: { type: 'number' },
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
const requirementDoc = args?.requirementDoc
const decisionDoc = args?.decisionDoc

if (!featureName) throw new Error('缺少功能名称，请提供 featureName 参数')

log(`开始构建工作流：${featureName}`)

// ========== 阶段一：架构设计 ==========
phase('架构设计')

log('设计系统架构...')

const architecture = await agent(
  `为以下功能设计系统架构。

功能名称：${featureName}
需求文档：${requirementDoc || '待提供'}
决策记录：${decisionDoc || '待提供'}

请执行：
1. 分析现有代码架构
2. 确定新增模块和修改模块
3. 定义模块职责和依赖关系
4. 设计数据流
5. 识别技术风险

输出完整的架构设计文档（Markdown 格式）。`,
  { label: '架构设计', phase: '架构设计', schema: ARCHITECTURE_SCHEMA, agentType: 'Builder' }
)

log(`模块数量：${architecture?.modules?.length}`)
log('架构设计完成')

// ========== 阶段二：详细设计 ==========
phase('详细设计')

log('设计详细方案...')

const design = await agent(
  `基于以下架构设计，完成详细设计。

功能名称：${featureName}

【架构设计】
${architecture?.title}
模块：${architecture?.modules?.map(m => `- ${m.name}: ${m.responsibility}`).join('\n')}

请执行：
1. API 设计（RESTful 接口定义）
2. 数据库设计（表结构、索引、关系）
3. 接口设计（服务接口、DTO 定义）
4. 异常处理设计
5. 缓存策略设计

输出完整的详细设计文档（Markdown 格式）。`,
  { label: '详细设计', phase: '详细设计', schema: DESIGN_SCHEMA, agentType: 'Builder' }
)

log('详细设计完成')

// 保存设计文档
const featureDir = `docs/features/${featureName}`
await Write(`${featureDir}/architecture.md`, `# ${architecture?.title}

## 模块设计
${architecture?.modules?.map(m => `### ${m.name}
**职责：** ${m.responsibility}
**依赖：** ${m.dependencies?.join(', ') || '无'}
`).join('\n')}

## 数据流
${architecture?.dataFlow}

## 技术栈
${architecture?.techStack?.join('\n- ')}

## 风险
${architecture?.risks?.join('\n- ')}
`)

await Write(`${featureDir}/design.md`, `# ${design?.title}

## API 设计
${design?.apiDesign?.map(a => `### ${a.method} ${a.endpoint}
${a.description}
**请求：** ${a.request}
**响应：** ${a.response}
`).join('\n')}

## 数据库设计
${design?.databaseDesign?.map(d => `### ${d.table}
**字段：** ${d.columns?.join(', ')}
**索引：** ${d.indexes?.join(', ') || '无'}
**关系：** ${d.relations?.join(', ') || '无'}
`).join('\n')}

## 接口设计
${design?.interfaceDesign?.map(i => `### ${i.name}
${i.description}
**方法：** ${i.methods?.join(', ')}
`).join('\n')}
`)

log(`设计文档已保存到 ${featureDir}`)

// ========== 阶段三：编码实现 ==========
phase('编码实现')

log('实现代码...')

const implementation = await agent(
  `根据设计文档实现代码。

功能名称：${featureName}

【架构设计】
模块：${architecture?.modules?.map(m => `- ${m.name}: ${m.responsibility}`).join('\n')}

【详细设计】
API：${design?.apiDesign?.map(a => `${a.method} ${a.endpoint}`).join('\n')}
数据库：${design?.databaseDesign?.map(d => d.table).join('\n')}

实现要求：
1. 遵循项目代码规范
2. 使用依赖注入
3. 正确处理异步
4. 完善异常处理
5. 添加必要的日志
6. 遵循 SOLID 原则`,
  { label: '编码实现', phase: '编码实现', agentType: 'Builder' }
)

log('编码实现完成')

// ========== 阶段四：代码审查 ==========
phase('代码审查')

log('执行代码审查...')

const [archReview, qualityReview, securityReview, perfReview] = await parallel([
  // 架构审查
  () => agent(
    `审查代码的架构质量。
检查：
1. 分层与依赖 — 依赖方向是否正确
2. 模块耦合 — 模块间是否过度耦合
3. SOLID 原则 — 单一职责、开闭原则
4. 领域边界 — 领域模型是否正确封装`,
    { label: '架构审查', phase: '代码审查', schema: REVIEW_SCHEMA, agentType: 'Builder' }
  ),
  // 代码质量审查
  () => agent(
    `审查代码质量。
检查：
1. 命名规范 — 是否符合项目约定
2. 代码质量 — 单一职责、方法长度
3. 异常处理 — 是否有空 catch、资源泄漏
4. 重复代码 — 是否有可提取的公共方法
5. null 安全 — 是否有潜在的 NullReferenceException`,
    { label: '代码质量', phase: '代码审查', schema: REVIEW_SCHEMA, agentType: 'Builder' }
  ),
  // 安全审查
  () => agent(
    `审查代码安全性。
检查：
1. SQL 注入 — 是否使用参数化查询
2. XSS — 是否对用户输入做了转义
3. 硬编码密钥 — 是否有敏感信息硬编码
4. 权限校验 — 接口是否有权限控制
5. 敏感数据日志 — 是否在日志中打印了敏感信息`,
    { label: '安全审查', phase: '代码审查', schema: REVIEW_SCHEMA, agentType: 'Builder' }
  ),
  // 性能审查
  () => agent(
    `审查代码性能。
检查：
1. N+1 查询 — 是否有循环查询数据库
2. 不必要 DB 调用 — 是否有可以缓存的查询
3. 大对象 — 是否有大对象分配
4. 同步阻塞 — 是否有 .Result/.Wait() 阻塞异步
5. 缺少索引 — 查询条件是否有索引支持`,
    { label: '性能审查', phase: '代码审查', schema: REVIEW_SCHEMA, agentType: 'Builder' }
  ),
])

// 汇总审查结果
const allFindings = [
  ...(archReview?.findings || []),
  ...(qualityReview?.findings || []),
  ...(securityReview?.findings || []),
  ...(perfReview?.findings || []),
]

const critical = allFindings.filter(f => f.level === 'CRITICAL')
const high = allFindings.filter(f => f.level === 'HIGH')

if (critical.length > 0) {
  log('🔴 CRITICAL 问题：')
  critical.forEach(f => log(`  - ${f.file}:${f.line} — ${f.description}`))
  return { status: 'BLOCKED', reason: '存在 CRITICAL 问题', findings: critical }
}

if (high.length > 0) {
  log('🟠 HIGH 问题：')
  high.forEach(f => log(`  - ${f.file}:${f.line} — ${f.description}`))
}

log('代码审查完成')

// ========== 阶段五：测试验证 ==========
phase('测试验证')

log('运行确定性验证...')

const verification = await agent(
  `验证要求：
1. dotnet build --configuration Release → 记录退出码
2. dotnet test → 记录退出码与「通过/失败/跳过」数量
3. git diff --stat → 记录变更文件清单

判定规则：
- 仅当 build 退出码 == 0 且 test 退出码 == 0 时，status = PASS
- 任一退出码 != 0，status = FAIL`,
  { label: '测试验证', phase: '测试验证', schema: REVIEW_SCHEMA, agentType: 'Builder' }
)

if (verification?.status !== 'PASS') {
  log('⚠️ 验证未通过')
  return { status: 'BLOCKED', reason: '验证未通过', findings: verification?.findings }
}

log('验证通过')
log('构建工作流完成')

return {
  status: 'SUCCESS',
  feature: featureName,
  architecture: {
    modules: architecture?.modules?.map(m => m.name),
  },
  design: {
    apis: design?.apiDesign?.map(a => `${a.method} ${a.endpoint}`),
    tables: design?.databaseDesign?.map(d => d.table),
  },
  review: {
    critical: critical.length,
    high: high.length,
    total: allFindings.length,
  },
  verification: verification?.status,
  documentDir: featureDir,
}
