---
name: index-system-division
description: 三套索引系统分工——SQLite符号索引、CodeGraph图谱、context-mode语义搜索
metadata:
  type: reference
---

## 三套索引系统分工

### 系统 1：SQLite 符号索引（`search.ps1`）
**定位：快速符号导航**
- 速度：⚡ 毫秒级
- 用途：类/方法/接口/属性/调用链定位
- 加密项目：✅ 通过 Roslyn 编译期提取
- 优势：快、精准、资源消耗小
- 劣势：不存储源码

### 系统 2：CodeGraph（`mcp__codegraph__*`）
**定位：代码图谱 + 源码读取**
- 速度：🐌 需要初始化
- 用途：代码结构图谱、源码读取、完整调用链
- 加密项目：✅ 通过 node.exe 白名单读明文
- 优势：能读源码、图谱完整、支持影响分析
- 劣势：资源消耗大

### 系统 3：context-mode（`ctx_*`）
**定位：文档索引 + 语义搜索 + 批量命令**
- 速度：🐌 需要索引
- 用途：文档索引、语义搜索、批量命令执行
- 加密项目：⚠️ JavaScript 沙箱读乱码，Shell 模式读明文
- 优势：支持语义搜索、可索引任意内容
- 劣势：JavaScript 沙箱不能读加密文件

### 最佳实践工作流
```
1. SQLite 索引：快速定位符号位置（行号）
   ↓
2. CodeGraph：查看方法体源码、完整调用链
   ↓
3. context-mode：索引和搜索相关文档
   ↓
4. PowerShell：临时读取特定文件
```

## Why:
三套系统各有优势，根据场景选择，不要只用一个。

## How to apply:
定位符号用 SQLite，看源码用 CodeGraph，搜文档用 context-mode。
