---
name: obsidian-pipeline
description: >
  当用户说"学习这篇文章"、"精读这篇"、"这篇公众号不错"、"这个开源项目值得看看"、
  "沉淀到 Obsidian"、"save to vault"、"deepread and save"，或提及 /obsidian-pipeline 时触发。
  处理公众号、博客、GitHub 仓库、技术文档、论坛、本地 PDF 的深度阅读，
  将结构化笔记写入 Obsidian vault 并推送到 GitHub。
---

# Obsidian Pipeline — 精读沉淀工作流

## 概览

从各种来源深度阅读后，将结构化笔记沉淀到 Obsidian vault 并同步到 GitHub。

## 用户环境

读取用户环境信息，不要假设路径：

- Vault 路径：询问用户或从上下文获取（参考值：`E:\ObsidianVault`）
- GitHub 仓库：询问用户或从上下文获取（参考值：`SA2687890878/obsidian-vault`）

如果用户从未指定路径，**停下来询问**，不要硬编码。

---

## 流程

### Step 1: 精读原文

根据内容类型调用 deepread：

| 内容类型 | 调用方式 |
|---|---|
| 微信公众号 URL | `deepread url=<url> depth=deep` |
| 博客/论坛 URL | `deepread url=<url> depth=deep` |
| 本地 Markdown/PDF | `deepread path=<path> depth=deep` |
| 批量对比 | `deepread batch=[{url/path:...}]` |
| 快速浏览 | `deepread url=<url> depth=quick` |

**完成标准：**
- [ ] deepread 返回完整报告
- [ ] 提取到标题、作者、核心观点

**反模式：**
- ❌ 如果用户只给了关键词没给链接 → 停下来 → 用 web_search 找到链接后再精读
- ❌ 如果 deepread 失败（反爬/403）→ 停下来 → 告知用户并建议粘贴正文

### Step 2: 分类存放

读取 `references/folder-mapping.md` 获取分类规则，将笔记写入正确目录。

**完成标准：**
- [ ] 根据 URL 或内容特征确定了来源类型
- [ ] 选择了正确的子目录

### Step 3: 写入笔记

读取 `references/note-template.md` 获取模板格式，用 write 工具写入：

```
文件路径：{vault}/01-精读笔记/{分类}/YYYY-MM-DD-标题.md
```

**完成标准：**
- [ ] 文件已写入，Frontmatter 完整（title/source/source_type/author/date/tags/status）
- [ ] 一句话总结用自己的话，不复制原文
- [ ] 核心要点 3 个，每个一句话
- [ ] 至少 1 个关联笔记双链（没有则写"暂无"）

**反模式：**
- ❌ 如果发现自己在复制原文做总结 → 停下来 → 用自己的话重写
- ❌ 如果 tags 少于 2 个 → 补充主题标签

### Step 4: Git 同步

```bash
cd {vault_path}
git add .
git commit --no-verify -m "[feat] 新增精读笔记: {标题}"
git push
```

**完成标准：**
- [ ] git push 成功（无报错）

**反模式：**
- ❌ 如果 push 失败（网络/认证）→ 告知用户 → 不要重试超过 2 次

### Step 5: 告知用户

输出：
1. 笔记文件路径（可点击）
2. GitHub 同步状态
3. 一句话建议（如"建议在 Obsidian 中补充个人思考"）

---

## 质量门槛

不是所有内容都值得完整沉淀。按以下标准决定深度：

| 内容质量 | 处理方式 |
|---|---|
| 有独特观点/深度分析 | 完整精读 + 完整笔记 |
| 一般教程/常识性内容 | quick 模式 + 一句话摘要存入 |
| 纯操作步骤/时效性强 | 不沉淀，只告诉用户 |
| 低质量/抄袭内容 | 不沉淀，明确告知 |

判断依据：deepread 报告中是否有"独特观点"或"可复用知识"。
