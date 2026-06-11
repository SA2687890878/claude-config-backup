---
name: pdftotext-path
description: 本机PDF文本提取工具路径，避免用Node.js库绕弯路
metadata:
  type: reference
---

## 位置

```bash
/mingw64/bin/pdftotext
```

## 用法

```bash
/mingw64/bin/pdftotext "文件路径.pdf" - 2>/dev/null | head -500
```

## 不要尝试

- ~~Node.js pdf-parse~~ — v2.x 导出方式变了，不是函数
- ~~Node.js pdfjs-dist~~ — npm install 在 sandbox 中失败
- ~~PowerShell Get-Content~~ — 二进制乱码
- ~~WebFetch~~ — 不支持 file:// 协议

## Why:
Git Bash (mingw64) 自带 poppler 工具链，pdftotext 可直接使用，一行搞定。

## How to apply:
读取本地 PDF 文档时，第一反应用 `/mingw64/bin/pdftotext`。
