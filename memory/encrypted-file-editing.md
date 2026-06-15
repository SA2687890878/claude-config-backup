---
name: encrypted-file-editing
description: DGClient 加密 .cs 文件的读写规则 — 详见 rules/tools/code-access.md
metadata:
  type: feedback
---

DGClient 加密文件的读写规则已统一记录在 `rules/tools/code-access.md` 的"写入规则"段落。

核心要点：
- **读取**: node.exe ✅ PowerShell ✅ bash ❌
- **写入**: node.exe ❌ PowerShell ✅
- **编辑方法**: 用 PowerShell 脚本读取→修改→写回

详见: `~/.claude/rules/tools/code-access.md`
