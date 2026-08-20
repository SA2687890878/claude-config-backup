# Brooks 精华卡（R1-R6/T1-T6 + Iron Law + Pain×Spread + HealthScore）

> 来源：`decay-risks 272行` + `test-decay 239行` + `common:211` + `debt:54` + `health:46` 压至1表，按需Read

## Iron Law

> `症状→来源→后果→修复` 四段式，缺一段即噪音（`common:6`）

## R1-R6/T1-T6 症状表

| Code | 症状一句话 | 严重度 |
|------|------------|--------|
| R1 认知过载 | 命名乱/嵌套深/函数>50行 | Warning |
| R2 变更传播 | 改1处牵N处，无深模块 | Critical |
| R3 知识重复 | 同逻辑3处拷贝 | Warning |
| R4 偶发复杂度 | 为用而用框架 | Suggestion |
| R5 依赖错乱 | 循环/不稳定依赖 | Critical |
| R6 领域失真 | 代码不贴业务，贫血模型 | Warning |
| T1 脆 | 改实现就崩 | Warning |
| T2 mock滥用 | 1测mock 5对象 | Warning |
| T3 覆盖幻觉 | 覆盖高断言弱 | Suggestion |
| T4 慢 | 单测>1s/套件>5min | Suggestion |
| T5 不可读 | 无Given-When-Then | Suggestion |
| T6 金字塔失真 | E2E多单元少 | Suggestion |

## Pain×Spread

`Pain1-3 × Spread1-3 = 1-9分`，intentional/accidental（`debt:54`）

## HealthScore

`Arch30/Debt25/PR25/Test20`，无PR重分配40/33/27，Critical-15（`health:46`+`common:211`）
