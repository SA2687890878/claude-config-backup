# 精读笔记模板

文件名格式：`YYYY-MM-DD-文章标题.md`

```markdown
---
title: "{{title}}"
source: "{{source_url}}"
source_type: "{{source_type}}"
author: "{{author}}"
date: {{date}}
tags:
  - 精读
  - {{tag1}}
  - {{tag2}}
status: "inbox"
---

# {{title}}

## 一句话总结
> {{one_liner}}

## 核心要点
1. **{{point_1}}**
2. **{{point_2}}**
3. **{{point_3}}**

## 详细笔记
{{deepread_report}}

## 我的思考
{{personal_reflection}}

## 关联笔记
- [[{{related_note}}]]

## 原文链接
[{{title}}]({{source_url}})
```

## 字段说明

| 字段 | 必填 | 说明 |
|---|---|---|
| title | ✅ | 文章标题 |
| source | ✅ | 原文 URL |
| source_type | ✅ | 公众号/博客/技术文档/书籍 |
| author | ✅ | 作者，未知写"未知" |
| date | ✅ | YYYY-MM-DD 格式 |
| tags | ✅ | 至少包含"精读" + 1 个主题标签 |
| status | ✅ | inbox（默认）/ reading / done |

## 质量要求

- 一句话总结：用自己的话，1-2 句，不复制原文
- 核心要点：3 个，每个一句话，突出独特观点
- 我的思考：至少 1 条与已有知识的关联
- 关联笔记：至少 1 个双链，没有则写"暂无"
