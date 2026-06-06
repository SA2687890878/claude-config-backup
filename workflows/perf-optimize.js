// Workflow: 机器可执行的多阶段编排（自动调度 agents 并行工作）
// 对应 Command: ~/.claude/commands/perf-optimize.md（人类可读流程文档）
//
// 预期行为: 4 阶段 — 性能分析(先量) → 优化方案 → 优化实施 → 复测验证(后优,确定性退出码 gate)
// 失败策略: 分析无瓶颈 → 提示"当前性能可接受"；编译/回归 FAIL 或无改善 → 返回 BLOCKED 建议回滚
// 可跳过: 用户已有明确瓶颈时可跳过"性能分析"
// 预计 token: ~60-120k
export const meta = {
  name: 'perf-optimize',
  description: '性能优化工作流 — 先量后优、数据驱动、复测验证',
  phases: [
    { title: '性能分析', detail: '收集基线数据、定位瓶颈' },
    { title: '优化方案', detail: '制定策略、评估收益风险' },
    { title: '优化实施', detail: '实施代码变更' },
    { title: '复测验证', detail: '对比优化前后指标、确认无回归' },
  ],
}

// 性能基线 schema
const BASELINE_SCHEMA = {
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
  },
  required: ['target', 'bottleneck', 'bottleneckType'],
}

// 优化方案 schema
const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    strategies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          expectedGain: { type: 'string' },
          risk: { type: 'string' },
          effort: { type: 'string' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
        },
      },
    },
    recommendation: { type: 'string' },
  },
  required: ['strategies', 'recommendation'],
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

/**
 * 性能优化工作流
 *
 * 触发词：优化/慢/性能/卡
 *
 * 流程：
 * 1. 收集性能基线数据，定位瓶颈
 * 2. 制定优化方案，评估收益风险
 * 3. 用户确认后实施优化
 * 4. 复测对比，确认无回归
 */
async function performanceOptimization(args) {
  const { target, description, currentMetrics, budget } = args

  // Budget 控制：默认 120k
  const tokenBudget = budget?.total || 120000

  if (!target) {
    throw new Error('缺少优化目标，请提供 target 参数（如：接口名、页面、查询）')
  }

  log(`开始性能优化工作流：${target}`)

  // ========== 阶段一：性能分析 ==========
  phase('性能分析')

  log('收集性能基线数据...')

  const baseline = await agent(
    `你是性能工程师，分析以下性能问题。

优化目标：${target}
问题描述：${description || '待分析'}
当前指标：${currentMetrics || '待收集'}

请执行以下分析：
1. 使用 codegraph_explore 分析相关代码结构和调用链
2. 检查数据库查询（N+1、全表扫描、缺少索引）
3. 检查代码逻辑（同步阻塞、大对象、资源泄漏）
4. 检查缓存策略

输出：
1. 性能指标基线
2. 瓶颈类型和位置
3. 根本原因分析`,
    { label: '性能分析', phase: '性能分析', schema: BASELINE_SCHEMA }
  )

  log(`瓶颈类型：${baseline?.bottleneckType}`)
  log(`瓶颈位置：${baseline?.bottleneck}`)

  // ========== 阶段二：优化方案 ==========
  phase('优化方案')

  log('制定优化方案...')

  const plan = await agent(
    `你是性能工程师，制定优化方案。

优化目标：${target}
瓶颈类型：${baseline?.bottleneckType}
瓶颈位置：${baseline?.bottleneck}
根因：${baseline?.rootCause}

常见优化手段：
- 索引优化 → EXPLAIN 验证
- 消除 N+1 → Include()/Join() 替代循环查询
- AsNoTracking() 用于只读查询
- 引入缓存（MemoryCache/Redis）
- 异步化 IO 操作
- 分页/延迟加载
- 批量操作替代逐条处理

请制定优化方案，每个策略评估：
1. 预期收益（响应时间/吞吐量提升幅度）
2. 改动风险（数据一致性/兼容性影响）
3. 工作量（修改文件数量）

输出优化策略列表和推荐方案。`,
    { label: '优化方案', phase: '优化方案', schema: PLAN_SCHEMA }
  )

  log('优化方案：')
  plan?.strategies?.forEach((s, i) => {
    log(`  ${i + 1}. [${s.priority}] ${s.name} — ${s.expectedGain}`)
  })
  log(`推荐：${plan?.recommendation}`)

  // 决策点：等待用户确认
  log('⏸️ 等待用户确认优化方案后继续实施...')

  // ========== 阶段三：优化实施 ==========
  phase('优化实施')

  log('实施优化...')

  const implementation = await agent(
    `你是实现者，实施性能优化。

优化目标：${target}
优化方案：${plan?.recommendation}
具体策略：
${plan?.strategies?.map((s, i) => `${i + 1}. [${s.priority}] ${s.name}: ${s.description}`).join('\n')}

实施要求：
1. 按优先级顺序实施（P0 → P1 → P2）
2. 每个变更保持最小改动原则
3. 确保不破坏现有功能
4. 遵循项目代码规范

输出：
1. 修改的文件列表和变更说明
2. 新增的索引/缓存配置
3. 测试建议`,
    { label: '优化实施', phase: '优化实施' }
  )

  log('优化代码完成')

  // 编译验证（确定性退出码 gate）
  // 官方依据：验证基于可返回 pass/fail 的确定性信号，而非 agent 自述。
  log('确定性编译验证（读取真实退出码）...')

  const buildGate = await agent(
    `你是验证执行器，运行命令并如实回报真实退出码。

执行：\`dotnet build\` → 记录退出码。
判定：退出码 == 0 时 status = PASS；否则 status = FAIL 并附真实报错原文。
不要在未运行命令的情况下声称成功，必须附证据。
输出：状态（PASS/FAIL）、退出码与证据、总结。`,
    { label: '编译验证', phase: '优化实施', schema: REVIEW_SCHEMA }
  )

  if (buildGate?.status !== 'PASS') {
    log('⚠️ 编译未通过（退出码非 0），优化中断')
    return { status: 'BLOCKED', reason: '优化后编译未通过', findings: buildGate?.findings }
  }

  // ========== 阶段四：复测验证 ==========
  phase('复测验证')

  log('复测性能...')

  const retest = await agent(
    `你是性能工程师，复测优化效果。

优化目标：${target}
优化前基线：
${baseline?.metrics?.map(m => `- ${m.name}: ${m.value} ${m.unit}`).join('\n') || '无基线数据'}

请执行：
1. 重新测量性能指标
2. 与基线对比，计算提升幅度
3. 确认功能无回归

注意：
- 不要在生产环境运行 ANALYZE
- 使用 EXPLAIN (BUFFERS, FORMAT TEXT) 验证查询计划
- 检查 EF Core 日志确认 SQL 变更

输出优化前后对比报告。`,
    { label: '复测性能', phase: '复测验证' }
  )

  log('功能回归测试（确定性退出码 gate）...')

  const regressionGate = await agent(
    `你是验证执行器，运行回归测试并如实回报真实退出码。

执行：\`dotnet test\` → 记录退出码与「通过/失败/跳过」数量。
判定：退出码 == 0（无失败用例）时 status = PASS；否则 status = FAIL 并附失败用例原文。
性能优化绝不能以牺牲正确性为代价 —— 任一测试失败即判 FAIL。
必须附实际运行命令与返回内容作为证据。
输出：状态（PASS/FAIL）、退出码与证据、总结。`,
    { label: '回归测试', phase: '复测验证', schema: REVIEW_SCHEMA }
  )

  if (regressionGate?.status !== 'PASS') {
    log('⚠️ 回归测试未通过（存在失败用例），建议回滚优化')
    return { status: 'BLOCKED', reason: '优化引入功能回归', findings: regressionGate?.findings }
  }

  // 完成验证
  log('完成验证...')

  const verification = await agent(
    `你是最终验证者，确认本次性能优化「有效且无回归」。

优化目标：${target}
优化前基线：
${baseline?.metrics?.map(m => `- ${m.name}: ${m.value} ${m.unit}`).join('\n') || '无基线数据'}

确定性前提（已由前序 gate 保证）：编译退出码 == 0、回归测试退出码 == 0。
你需基于上一步复测的「优化前后真实数据」判定：
1. 关键指标是否较基线有可量化的改善（附前后数值与提升幅度）
2. 若无改善或反而退化 → status = FAIL，建议回滚
3. 改善需用真实测量数据支撑，不接受「应该变快了」这类主观断言

输出验证报告，包含：状态（PASS/FAIL）、前后指标对比证据、总结。`,
    { label: '完成验证', phase: '复测验证', schema: REVIEW_SCHEMA }
  )

  if (verification?.status !== 'PASS') {
    log('⚠️ 完成验证未通过（无可量化改善或存在问题）')
    return { status: 'BLOCKED', reason: '完成验证未通过', findings: verification?.findings }
  }

  log('验证通过（编译/测试退出码为 0，且有可量化性能改善）')

  // ========== 返回结果 ==========
  log('性能优化工作流完成')

  return {
    status: 'SUCCESS',
    target: target,
    baseline: baseline?.metrics,
    bottleneck: baseline?.bottleneck,
    strategies: plan?.strategies,
    reviews: {
      verification: verification,
    },
  }
}
