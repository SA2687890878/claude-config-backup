# 目录结构指南

> Claude Code 全局配置中各文件夹、分类的作用，以及整体如何协调实现 Harness Engineering 工程。

**版本**：v4.0 | **最后更新**：2026-08-27

---

## 目录结构总览

```
~/.claude/
├── rules/                    # 核心规则（自动加载，6 条）
├── knowledge/               # 知识库（按需加载 + 分层索引）
├── memory/                  # 记忆（会话级）
├── docs/                    # 文档（给人看的）
├── skills/                  # 技能（按需调用，28 个）
├── hooks/                   # 钩子（自动触发，20 个）
└── projects/                # 项目级数据
```

---

## 一、rules/ 目录（核心规则，自动加载）

```
~/.claude/rules/
├── tools/
│   ├── code-access.md          # 代码访问规则
│   └── token-optimization.md   # Token 优化规则
└── quality/
    ├── gates.md                # 质量门禁规则（5 道 Gate）
    ├── verification.md         # 验证规则
    └── interaction/
        ├── confidence-reporting.md  # 置信度标注规范
        └── rigor-standards.md       # 严谨性标准
```

**作用**：每次会话启动自动加载到上下文（约 170 行），必须遵守不可跳过。

---

## 二、knowledge/ 目录（知识库，按需加载）

```
~/.claude/knowledge/
├── MEMORY.md                    # 总索引（链接到各分类索引）
├── rules/                       # 按需加载的规则（43+ 参考）
├── engineering/                 # 工程知识
├── project/                     # 项目知识
└── business/                    # 业务知识
```

**作用**：需要时再读取，通过分层索引查找。与 `rules/` 的区别：rules 自动加载（核心、精简、强制），knowledge 按需加载（详细、参考、学习）。

| 特性 | `rules/` | `knowledge/` |
|------|----------|--------------|
| 加载方式 | 自动加载 | 按需加载 |
| 内容 | 核心规则（精简） | 详细说明（完整） |
| Token 消耗 | 每次都消耗 | 需要时才消耗 |
| 用途 | 强制遵守 | 参考学习 |

---

## 三、memory/ 目录（记忆，会话级）

```
~/.claude/memory/
├── MEMORY.md                          # 记忆索引
└── *.md                               # 决策、约束、技术经验
```

**作用**：会话级，记录决策、约束、技术经验。项目级记忆在 `projects/<项目>/memory/`。

---

## 四、docs/ 目录（文档中心，给人看）

```
~/.claude/docs/
├── README.md                         # 导航中心
├── INDEX.md                          # 文档索引
├── DIRECTORY-GUIDE.md                # 目录结构指南（本文件）
├── HARNESS-ENGINEERING.md            # Harness Engineering 理念
├── SETUP.md                          # 复用指南
├── 01-getting-started/               # 入门
├── 02-guides/                        # 指南
├── 03-architecture/                  # 架构
└── 04-reference/                     # 参考
```

**作用**：给人看的文档，不自动加载。

---

## 五、skills/ 目录（技能，按需调用）

```
~/.claude/skills/
├── INDEX.md                      # Skills 索引
├── requirements/                 # 需求分析
├── research/                     # 深度调研
├── arch-review/                  # 架构审查
├── dev-workflow/                 # 开发工作流
├── pipeline-executor/            # 一键全流程（主入口）
└── ...（28 个技能）
```

**作用**：按需调用（触发词或 `/skill-name`），每个 Skill 封装一个完整工作流程，核心指令 + references 分离。

---

## 六、hooks/ 目录（钩子，自动触发）

真实 20 个 hook 见 `SETUP.md` 的 Hook 清单。核心：

```
~/.claude/hooks/
├── session-start.js              # 会话启动：加载项目知识
├── context-injector.js           # 用户输入：智能注入规则
├── skill-router.js               # 用户输入：路由到 skill
├── secret-guard.js               # 写文件/Bash 前：密钥防护
├── bash-guard.js                 # Bash 前：安全检查
├── git-commit-review.js          # 提交前：git 安全审查
├── cs-checks.js                  # 写 .cs 后：C# 语法检查
├── build-verify.js               # 会话结束：编译+测试验证
└── ...（其余见 SETUP.md）
```

**作用**：特定事件自动执行——检查质量、安全性，注入规则、路由工作流。

---

## 七、projects/ 目录（项目级数据）

```
~/.claude/projects/
├── <project-name>/
│   └── memory/
│       ├── MEMORY.md              # 项目记忆索引
│       └── *.md                   # 项目经验文件
└── ...
```

**作用**：项目特定，每个项目有自己的记忆和经验，会话启动时自动加载。

### 目录命名规则
- 项目路径的盘符与分隔符统一转为 `-`（目录名形如 `盘符--项目名`，不含冒号与反斜杠、不含真实用户名）。

---

## 八、整体协调：如何实现 Harness Engineering

```
用户输入
  ↓
hooks 自动注入规则（context-injector.js）
  ↓
skill-router 路由到对应 skill（pipeline-executor 主入口）
  ↓
Claude 按规则执行任务（5 阶段 + 5 门禁）
  ↓
质量门禁验证（gates.md + verification.md）
  ↓
经验沉淀到 knowledge（project-knowledge.js）
  ↓
下次会话自动加载经验
```

### 核心原则

1. **Context First（最小上下文）**：核心规则自动加载，参考规则按需加载
2. **Artifact First（围绕交付物）**：每阶段有产物，可追溯可复用
3. **Evidence First（退出码为王）**：所有结论必须有证据
4. **Verification First（生成不等于正确）**：质量门禁 + 验证流程
5. **Quality Gate First（围绕质量门建设）**：5 个质量门禁
6. **Automation First（能 Hook 的不要交给 AI）**：自动注入、检查、验证、路由

---

## 九、最佳实践

- **新增规则**：核心规则放 `rules/`（≤50 行、含决策树和反模式）；参考规则放 `knowledge/rules/`
- **新增知识**：工程 → `knowledge/engineering/`；项目 → `knowledge/project/`；业务 → `knowledge/business/`；更新对应 INDEX.md
- **新增 Skill**：`skills/<name>/SKILL.md` + `references/`，更新 `skills/INDEX.md`
- **新增 Hook**：`hooks/<name>.js`，在 `settings.json` 注册触发时机

---

## 十、常见问题

- **为什么有两个 rules 目录？** `rules/` 自动加载（核心），`knowledge/rules/` 按需加载（参考）。
- **放哪个目录？** 每次都用放 `rules/`，偶尔用到放 `knowledge/rules/`。
- **如何新增规则/知识/Skill？** 见上方"最佳实践"。

---

## 十一、总结

| 成果 | 量化 |
|------|------|
| 核心规则 | 6 条，约 170 行（省 82%） |
| 知识库结构 | 层次化索引（总索引 → 分类索引 → 具体文件） |
| 规则架构 | 核心规则 + 参考规则分离 |
| 覆盖 | 7 类日常 + 5 门禁 + 单轨 pipeline |

**现在可以开始高质量工作了！**
