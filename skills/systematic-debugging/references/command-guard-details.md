# 命令防护详细列表

执行以下任何操作前必须先警告用户并等待确认。

| 类型 | 模式 | 风险 |
|------|------|------|
| Bash | `rm -rf` / `rm -r` | 递归删除 |
| Bash | `git push --force` / `-f` | 覆盖远程历史 |
| Bash | `git reset --hard` | 丢失未提交工作 |
| SQL | `DROP TABLE` / `DROP DATABASE` | 数据丢失 |
| SQL | `TRUNCATE` / `DELETE FROM` 无 WHERE | 清空/删除全表 |
| PS | `Remove-Item -Recurse -Force` | 递归强制删除 |

检测到危险命令时：**暂停 → 展示风险 → 等待确认 → 再执行。**
