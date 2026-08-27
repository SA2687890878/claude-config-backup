# Memory → Knowledge 同步机制

> 项目经验升级为工程知识，实现跨项目复用。高级功能，按需加载。

## 三层知识体系

```
Memory（项目级会话状态 + 经验）
  ↓ 沉淀
Knowledge（工程级可复用知识）
  ├── engineering/（工程规范、工具技巧）
  ├── project/（项目特定知识）
  └── business/（业务知识）
```

## Memory vs Knowledge

| 层级 | 位置 | 生命周期 | 用途 |
|------|------|---------|------|
| Memory | 项目 memory/ | 会话级，完成后归档 | 避免重复踩坑 |
| Knowledge | knowledge/ | 长期维护 | 跨项目复用 |

区分：项目特定的经验 → Memory；可复用的通用知识 → Knowledge。

## 同步流程

1. 读取 learnings.md
2. 识别可复用模式
3. 判断归属：项目特定 → `knowledge/project/<项目>/`；通用 → `engineering/` 或 `business/`
4. 更新对应的 Knowledge 文件（已存在则更新，不新建）
5. learnings.md 标记 `[已同步到 knowledge/xxx/yyy.md]`

## 识别规则

- **engineering/**：工具技巧、编码规范、测试模式、性能优化
- **project/<项目>/**：API 约定、数据库设计、常用模式、实体映射
- **business/**：业务流程、业务规则、术语表

## 查询

- Knowledge：`ctx_search` 或 grep 搜 `knowledge/`
- Memory：SessionStart 自动加载 learnings.md
