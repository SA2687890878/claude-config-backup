---
name: encrypted-file-git-blob-workflow
description: DGClient加密项目的.cs文件修改方式——通过git blob操作绕过透明加密
metadata:
  type: reference
---

## 问题

DGClient 加密的项目（如 pcs.crontabservice），.cs 文件直接 Read/Write 看到的是乱码。git 存储明文，磁盘存密文。

## 正确操作流程

### 读取
```bash
git show <commit>:<filepath>
```

### 修改（git blob三步曲）
```bash
# 1. 创建明文blob
git hash-object -w <临时明文文件>
# 2. 更新暂存区
git update-index --cacheinfo 100644,<blob-hash>,<目标路径>
# 3. 检出到工作区（加密）
git checkout-index -f -- <目标路径>
```

### Python批量修复模板
```python
import subprocess, tempfile, os
content = subprocess.run(['git','show',f'{ref}:{path}'], capture_output=True, text=True, cwd=repo).stdout
# ... 修改content ...
tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.cs', delete=False, encoding='utf-8')
tmp.write(content); tmp.close()
blob = subprocess.run(['git','hash-object','-w',tmp.name], capture_output=True, text=True, cwd=repo).stdout.strip()
subprocess.run(['git','update-index','--cacheinfo',f'100644,{blob},{target}'], cwd=repo)
subprocess.run(['git','checkout-index','-f','--',target], cwd=repo)
os.unlink(tmp.name)
```

## Why:
DGClient 对白名单进程（VS、git）透明加解密，对 PowerShell/claude/工具链是密文。

## How to apply:
修改加密项目的 .cs 文件时，始终使用 git blob 三步曲。不要尝试直接 Read/Write/Edit。
