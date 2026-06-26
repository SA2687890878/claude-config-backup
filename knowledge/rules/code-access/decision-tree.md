# 决策树

## 代码访问决策树

```
找符号（类/方法/接口/调用关系/谁调用谁）?
  → SQLite 索引（快速定位行号）
  → 然后用 CodeGraph 查看源码

看具体方法体逻辑?
  → CodeGraph codegraph_node（能读明文）
  → 或用 node.exe 读取
  → 不要用 bash/head（会读到乱码）

理解模块结构/影响分析?
  → CodeGraph（图谱更完整）

找注释/字符串/配置/语义关键词?
  → READABLE: ctx_search(source: "<项目名>-src", query: "...")
  → ENCRYPTED: 用 Shell 模式的 ctx_execute

索引和搜索文档?
  → context-mode ctx_index + ctx_search

批量执行命令并分析结果?
  → context-mode ctx_batch_execute（用 Shell 模式）

非 .cs 文件（.vue/.js/.json/.md/.sql/.csproj/.xml）?
  → 永远不加密。优先 ctx_search 已建索引；否则 Glob+Grep+Read
```

## 最佳实践工作流

```
1. SQLite 索引：快速定位符号位置（行号）
   ↓
2. CodeGraph：查看方法体源码、完整调用链
   ↓
3. context-mode：索引和搜索相关文档
   ↓
4. node.exe/PowerShell：临时读取特定文件
```
