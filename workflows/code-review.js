// Workflow: 机器可执行的多阶段编排（自动调度 agents 并行工作）
// 对应 Command: ~/.claude/commands/code-review.md（人类可读流程文档）
//
// 预期行为: 4 阶段 — 变更收集 → 并行审查(5维度) → 问题汇总 → 修复建议
// 失败策略: 单维度审查失败 → 跳过该维度，其余维度继续；无变更 → 直接结束
// 可跳过: "修复建议"阶段可选，用户可只看问题清单
// 预计 token: ~60-100k
export const meta = {
  name: 'code-review',
  description: '代码审查工作流 — 并行多维度审查、问题汇总、修复建议',
  phases: [
    { title: '变更收集', detail: '确定审查范围、了解代码结构' },
    { title: '并行审查', detail: '5 个维度同时审查' },
    { title: '问题汇总', detail: '合并结果、按严重程度分类' },
    { title: '修复建议', detail: '为关键问题提供修复代码' },
  ],
}

// 审查发现 schema
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
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
  required: ['findings', 'summary'],
}

// 修复建议 schema
const FIX_SCHEMA = {
  type: 'object',
  properties: {
    fixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          description: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
  required: ['fixes', 'summary'],
}

/**
 * 代码审查工作流
 *
 * 触发词：审查/review/看看代码
 *
 * 流程：
 * 1. 收集变更范围
 * 2. 并行启动 5 个审查 Agent（架构、质量、安全、性能、最佳实践）
 * 3. 汇总问题，按严重程度分类
 * 4. 为 CRITICAL/HIGH 问题提供修复代码
 */
async function codeReview(args) {
  const { scope, branch, budget } = args

  // Budget 控制：默认 100k
  const tokenBudget = budget?.total || 100000

  log('开始代码审查工作流')

  // ========== 阶段一：变更收集 ==========
  phase('变更收集')

  log('收集变更信息...')

  const changes = await agent(
    `你是审查助手，收集代码变更信息。

审查范围：${scope || '当前变更'}
对比分支：${branch || '暂存区变更'}

请执行：
1. 运行 git status 查看变更文件
2. 运行 git diff 查看具体变更
3. 使用 codegraph_explore 了解变更代码的调用关系

输出：
1. 变更文件列表
2. 每个文件的变更摘要
3. 关键调用关系`,
    { label: '变更收集', phase: '变更收集' }
  )

  log('变更收集完成')

  // ========== 阶段二：并行多维度审查 ==========
  phase('并行审查')

  log('启动 5 个审查 Agent 并行审查...')

  const [archResult, qualityResult, securityResult, perfResult, bestPracticeResult] = await parallel([
    () => agent(
      `你是架构师，审查代码架构。

变更信息：
${changes || '无'}

检查以下维度：
1. 分层与依赖 — 依赖方向是否正确，是否有循环依赖
2. 模块耦合 — 模块间是否过度耦合
3. SOLID 原则 — 单一职责、开闭原则、里氏替换、接口隔离、依赖反转
4. 领域边界 — 领域模型是否正确封装

【审查纪律】只报会影响正确性、可维护性或明确需求的问题；不要报风格偏好，
不要为「凑数」制造发现。无问题就返回空列表。
输出审查发现列表。`,
      { label: '架构审查', phase: '并行审查', schema: FINDINGS_SCHEMA }
    ),
    () => agent(
      `你是 Staff Engineer，审查代码质量。

变更信息：
${changes || '无'}

检查以下维度：
1. 命名规范 — 是否符合项目约定
2. 代码质量 — 单一职责、方法长度、圈复杂度
3. 异常处理 — 是否有空 catch、资源泄漏
4. 重复代码 — 是否有可提取的公共方法
5. null 安全 — 是否有潜在的 NullReferenceException

【审查纪律】只报会影响正确性或可维护性的问题；不要报风格偏好，不要为「凑数」制造发现。
无问题就返回空列表。
输出审查发现列表。`,
      { label: '代码质量', phase: '并行审查', schema: FINDINGS_SCHEMA }
    ),
    () => agent(
      `你是安全工程师，审查代码安全性。

变更信息：
${changes || '无'}

检查以下维度：
1. SQL 注入 — 是否使用参数化查询
2. XSS — 是否对用户输入做了转义
3. 硬编码密钥 — 是否有敏感信息硬编码
4. 权限校验 — 接口是否有权限控制
5. 敏感数据日志 — 是否在日志中打印了敏感信息

【审查纪律】只报真实可利用的安全问题；不要报理论上无害的风格偏好。无问题就返回空列表。
输出审查发现列表。`,
      { label: '安全审查', phase: '并行审查', schema: FINDINGS_SCHEMA }
    ),
    () => agent(
      `你是性能工程师，审查代码性能。

变更信息：
${changes || '无'}

检查以下维度：
1. N+1 查询 — 是否有循环查询数据库
2. 不必要 DB 调用 — 是否有可以缓存的查询
3. 大对象 — 是否有大对象分配
4. 同步阻塞 — 是否有 .Result/.Wait() 阻塞异步
5. 缺少索引 — 查询条件是否有索引支持

【审查纪律】只报会实际影响性能的问题，不要为微优化「凑数」。无问题就返回空列表。
输出审查发现列表。`,
      { label: '性能审查', phase: '并行审查', schema: FINDINGS_SCHEMA }
    ),
    () => agent(
      `你是高级工程师，审查最佳实践。

变更信息：
${changes || '无'}

检查以下维度：
1. async/await 一致性 — 是否正确使用异步
2. 依赖注入 — 是否正确使用 DI
3. 配置管理 — 是否使用 IConfiguration
4. 日志规范 — 是否使用 ILogger，日志级别是否正确
5. API 规范 — 是否 RESTful，响应格式是否统一

【审查纪律】只报偏离项目约定且有实际影响的问题；不要报风格偏好。无问题就返回空列表。
输出审查发现列表。`,
      { label: '最佳实践', phase: '并行审查', schema: FINDINGS_SCHEMA }
    ),
  ])

  log('5 个审查 Agent 完成')

  // ========== 阶段三：问题汇总 ==========
  phase('问题汇总')

  log('汇总审查结果...')

  const allFindings = [
    ...(archResult?.findings || []),
    ...(qualityResult?.findings || []),
    ...(securityResult?.findings || []),
    ...(perfResult?.findings || []),
    ...(bestPracticeResult?.findings || []),
  ]

  const critical = allFindings.filter(f => f.level === 'CRITICAL')
  const high = allFindings.filter(f => f.level === 'HIGH')
  const medium = allFindings.filter(f => f.level === 'MEDIUM')
  const low = allFindings.filter(f => f.level === 'LOW')

  log(`审查结果：CRITICAL=${critical.length} HIGH=${high.length} MEDIUM=${medium.length} LOW=${low.length}`)

  if (critical.length > 0) {
    log('🔴 CRITICAL 问题：')
    critical.forEach(f => log(`  - ${f.file}:${f.line} — ${f.description}`))
  }

  if (high.length > 0) {
    log('🟠 HIGH 问题：')
    high.forEach(f => log(`  - ${f.file}:${f.line} — ${f.description}`))
  }

  // ========== 阶段四：修复建议 ==========
  // Budget 检查：剩余 token 不足时跳过修复建议
  if (budget && budget.remaining && budget.remaining() < 20000) {
    log('⚠️ token 不足，跳过修复建议阶段')
    return {
      status: critical.length > 0 ? 'FAIL' : 'CONDITIONAL',
      summary: { total: allFindings.length, critical: critical.length, high: high.length, medium: medium.length, low: low.length },
      findings: { architecture: archResult?.findings || [], quality: qualityResult?.findings || [], security: securityResult?.findings || [], performance: perfResult?.findings || [], bestPractice: bestPracticeResult?.findings || [] },
      note: '修复建议因 token 不足被跳过',
    }
  }

  if (critical.length > 0 || high.length > 0) {
    phase('修复建议')

    log('为 CRITICAL/HIGH 问题生成修复建议...')

    const fixResult = await agent(
      `你是高级工程师，为以下问题提供修复代码。

CRITICAL 问题：
${critical.map(f => `- ${f.file}:${f.line} — ${f.description}\n  建议：${f.suggestion}`).join('\n') || '无'}

HIGH 问题：
${high.map(f => `- ${f.file}:${f.line} — ${f.description}\n  建议：${f.suggestion}`).join('\n') || '无'}

为每个 CRITICAL/HIGH 问题提供具体的修复代码。
使用 Edit 工具直接修复，或提供代码片段供用户参考。`,
      { label: '修复建议', phase: '修复建议', schema: FIX_SCHEMA }
    )

    log('修复建议已生成')
  }

  // ========== 返回结果 ==========
  log('代码审查工作流完成')

  return {
    status: allFindings.length === 0 ? 'PASS' : (critical.length > 0 ? 'FAIL' : 'CONDITIONAL'),
    summary: {
      total: allFindings.length,
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    findings: {
      architecture: archResult?.findings || [],
      quality: qualityResult?.findings || [],
      security: securityResult?.findings || [],
      performance: perfResult?.findings || [],
      bestPractice: bestPracticeResult?.findings || [],
    },
    reviews: {
      architecture: archResult?.summary,
      quality: qualityResult?.summary,
      security: securityResult?.summary,
      performance: perfResult?.summary,
      bestPractice: bestPracticeResult?.summary,
    },
  }
}
