---
applyTo: "**/*.cs, **/*.csproj, **/*.vue, **/*.js"
---

# 代码访问规则（铁律）

> 探索代码时**先索引、最后 Read**。直接 Read 整文件是最浪费 token 的路径。

## 第一步：源码可读性探针

```bash
powershell -ExecutionPolicy Bypass -Command "
  \$f = Get-ChildItem -Path '.' -Filter '*.cs' -Recurse -File | Select-Object -First 1;
  if (-not \$f) { Write-Output 'NO_CS_FILES'; exit }
  \$lines = Get-Content \$f.FullName -Encoding UTF8 -TotalCount 3 -ErrorAction SilentlyContinue;
  \$text = \$lines -join ' ';
  if (\$text -match '(using |namespace |public |private |class |//|#region|\[assembly)') { Write-Output 'READABLE' } else { Write-Output 'ENCRYPTED' }
"
```

不要靠路径猜——文件系统级透明加解密对白名单进程透明，对 PowerShell/node/claude 是密文。

## 三套索引系统

| 工具 | 节省 | 适用 | 用途 |
|------|------|------|------|
| **SQLite 符号索引**（`search.ps1`） | ~95% | 加密 + 可读项目均可 | 类/方法/接口/调用链 — Roslyn 编译期提取，**首选** |
| **context-mode**（`ctx_search`） | ~95% | 仅 READABLE 项目 | 注释/字符串/语义关键词 — 转码脚本读不出加密明文 |
| **CodeGraph**（`mcp__codegraph__*`） | ~80% | 仅 READABLE 项目 | 结构图谱/影响分析 — 加密项目读不到源码会失效 |

**RTK** 已在 hooks 全局拦截 Bash 输出（~61% 压缩），无需手动调用。

## 决策树

```
找符号（类/方法/接口/调用关系/谁调用谁）?
  → search.ps1（两种项目都用，最省 token）

找注释/字符串/配置/语义关键词?
  → READABLE: ctx_search(source: "<项目名>-src", query: "...")
  → ENCRYPTED: 让用户在 VS Code 里贴片段（无路径）

看具体方法体逻辑?
  → READABLE: search.ps1 定位行号 → Read 精确范围
  → ENCRYPTED: 让用户贴

理解模块结构/影响分析（仅可读项目）?
  → codegraph_explore / codegraph_impact

非 .cs 文件（.vue/.js/.json/.md/.sql/.csproj/.xml）?
  → 永远不加密。优先 ctx_search 已建索引；否则 Glob+Grep+Read
```

## 关键命令模板

```bash
# 符号搜索（库名 = ProjectPath 末级目录名）
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Query "Pattern" -ProjectPath "<项目根>"
# 类型过滤：-Type class|interface|method|property
# 调用链
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Callers "Class.Method" -ProjectPath "<项目根>"
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\search.ps1" -Callees "Class.Method" -ProjectPath "<项目根>"
# 索引不存在时建：
powershell -ExecutionPolicy Bypass -File "C:\Users\admin\.claude\tools\sqlite-index\build.ps1" -ProjectPath "<项目根>"
```

## 反模式（禁止）

- ❌ 直接 Read 整个 .cs 文件来理解结构（用 search.ps1）
- ❌ 用 Glob+Grep 替代符号搜索（grep 不知道作用域，索引知道）
- ❌ 凭路径假设加密状态（用探针）
- ❌ 加密项目用 ctx_search 查 .cs（转码读不出明文）
- ❌ 加密项目用 codegraph（读密文等于读不到）
