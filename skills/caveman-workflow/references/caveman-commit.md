# 压缩提交信息

Conventional Commits 格式。不废话。Why 优先于 what。

## Subject

- `<type>(<scope>): <imperative summary>` — `<scope>` 可选
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- 祈使语气："add"、"fix"、"remove" — 不是 "added"、"adds"
- ≤50 字符，硬上限 72
- 无尾句号

## Body（仅需要时）

- Subject 自解释时跳过
- 仅在以下情况加 body：非显而易见的 why、breaking changes、迁移说明、关联 issue
- 72 字符换行
- 用 `-` 不用 `*`
- 末尾引用 issue：`Closes #42`

## 绝不写入

- "This commit does X"、"I"、"we" — diff 已说明
- "As requested by..." — 用 Co-authored-by
- "Generated with Claude Code"
- Emoji（除非项目约定）

## 示例

```
feat(api): add GET /users/:id/profile

Mobile client needs profile data without full user payload
to reduce LTE bandwidth on cold-launch screens.

Closes #128
```
