# 全局 CLAUDE.md 模板

## 使用说明

将下方"要复制的内容"部分复制到 `C:\Users\admin\.claude\CLAUDE.md`，替换原有内容。

---

## 要复制的内容

<!-- VIBESKILLS:BEGIN managed-block host=claude-code block=global-vibe-bootstrap version=1 hash=4037a348558a1949 -->
If the user explicitly invokes `$vibe` or `/vibe`, enter canonical `vibe` before normal execution.
Do not silently continue in ordinary mode first.
If canonical `vibe` cannot be loaded, report blocked instead of falling back silently.
This `CLAUDE.md` block is bootstrap guidance only; runtime authority remains canonical `vibe`.
Reading this bootstrap block alone is not proof of canonical vibe entry.
Do not preflight-scan the current workspace or repository for canonical proof files before launch.
Canonical launch must run first; only after canonical-entry returns a session root may you validate proof artifacts inside that session root.
Canonical claims require `host-launch-receipt.json`, `runtime-input-packet.json`, `governance-capsule.json`, and `stage-lineage.json` under the launched session root.
<!-- VIBESKILLS:END managed-block -->

## 语言偏好

用中文进行思考和推理，不用英文。所有对话使用简体中文。

## 用户技术栈

- **后端**: .NET 8.0（Web）+ .NET Framework 4.5.2（WPF）
- **前端**: Vue 2
- **数据库**: PostgreSQL
- **领域**: 数据采集追溯平台、WPF数采软件
- **职责**: 架构设计、需求分析、功能开发、性能优化、数据库调优

## 环境注意事项

- Windows 环境，优先使用 Read 工具或 PowerShell
- 公司源码特殊编码，读取用 PowerShell: `[System.IO.File]::ReadAllText('路径', [System.Text.Encoding]::UTF8)`
- UTF-8 BOM 文件（EF BB BF 开头）是正常文本

## 工作流（简要）

### 触发词

| 触发词 | 流程 |
|--------|------|
| 开发/添加/实现 | 需求分析 → 架构 → 实现 → 审查 |
| 修复/bug/报错 | 调试 → 修复 → 审查 |
| 优化/慢/性能 | 测量 → 优化 → 验证 |
| 审查/review | 架构审查 或 代码审查 |
| 跨项目/联动开发 | 项目发现 → 拆分 → 并行实现 → 集成 |
| 开始/今天做什么 | 状态检查 → 任务建议 |
| 讨论/有什么方案 | 头脑风暴 → 方案评估 |

### Agent 角色

需求分析师、架构师、实现者、审查员、调试专家、性能工程师

### 详细文档

- [完整工作流](docs/workflow.md)
- [Agent 角色定义](docs/agent-roles.md)
- [跨项目工作流](docs/cross-project.md)
- [接口契约模板](docs/templates/interface-contract.md)
- [审查审计机制](docs/review-audit.md)
- [自动迭代机制](docs/iteration.md)

## Caveman 模式

- 默认级别：`full`
- 手动激活：用户说 `/caveman` 时开启，说 `stop caveman` 或 `normal mode` 时关闭
- 中文优先：即使 caveman 模式开启，回复仍用中文
- 架构讨论自动关闭：涉及架构设计、方案评审时，切回正常模式

---

## 复制结束

上面"要复制的内容"部分复制到 `C:\Users\admin\.claude\CLAUDE.md`

---

## 文件结构

```
C:\Users\admin\.claude\
├── CLAUDE.md                         # 精简核心配置（< 80 行）
├── docs/                             # 详细文档目录
│   ├── README.md                     # 文档导航中心
│   ├── workflow.md                   # 完整工作流说明
│   ├── agent-roles.md                # Agent 角色定义
│   ├── cross-project.md              # 跨项目工作流
│   ├── review-audit.md               # 审查审计机制
│   ├── iteration.md                  # 自动迭代机制
│   ├── CLAUDE-template.md            # 本模板文件
│   └── templates/
│       └── interface-contract.md     # 接口契约模板
└── skills/                           # 已安装的 skills
```

---

## 验证清单

更新 CLAUDE.md 后，检查：

- [ ] 全局 CLAUDE.md 行数 < 80 行
- [ ] 所有文档链接可访问
- [ ] 触发词表完整
- [ ] Agent 角色列表完整
- [ ] 环境注意事项正确
- [ ] Caveman 模式配置正确

---

## 更新记录

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-06-11 | 3.0 | 兼容 Harness Engineering v3.0 配置体系 |
