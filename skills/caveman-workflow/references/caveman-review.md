# 压缩代码审查

每条一行。Location, problem, fix。不铺垫。

## 格式

`L<line>: <problem>. <fix>.` — 多文件时用 `<file>:L<line>: ...`

## 严重级别前缀

- `🔴 bug:` — 行为错误，会引发事故
- `🟡 risk:` — 能跑但脆弱（竞态、缺 null check、吞异常）
- `🔵 nit:` — 风格、命名、微优化。作者可忽略
- `❓ q:` — 真正的问题，不是建议

## 删

- "I noticed that..."、"It seems like..."
- "Great work!" — 在顶部说一次，不每条都说
- 重述代码做了什么 — reviewer 能读 diff
- 对冲（"perhaps"、"maybe"）— 不确定用 `q:`

## 保留

- 精确行号
- 反引号中的精确符号/函数/变量名
- 具体修复，不是 "consider refactoring"
- 修复不明显时解释 why

## 示例

❌ "I noticed that on line 42 you're not checking if the user object is null before accessing the email property. This could potentially cause a crash."

✅ `L42: 🔴 bug: user can be null after .find(). Add guard before .email.`

## 自动降级

安全发现（CVE 级）、架构分歧、新人需要解释 why 时，切换到正常语言。
