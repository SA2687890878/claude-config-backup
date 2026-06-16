# Hooks 代码质量标准

> 编写或修改 hooks 时查阅。

## 错误处理

- 所有 catch 块必须有错误输出：`console.error('[hook-name] Error:', e.message)`
- 循环内的 catch 可用 `process.stderr.write` 避免频繁输出

## readStdin 规范

```javascript
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 10000); // 超时时返回已接收数据
  });
}
```

## 路径计算

- 从 `input.cwd` 动态生成项目目录名
- 转换公式：`dir.replace(/:/g, '-').replace(/[\/\\]/g, '-')`
- 不要硬编码 `C--Users-admin`

## 环境变量

- HOME 必须有 fallback：`process.env.USERPROFILE || process.env.HOME || ''`
- readStdin 必须检查 trim：`if (!raw || !raw.trim()) process.exit(0)`

## PostToolUse vs PreToolUse

- PostToolUse：不阻断（只警告），避免回滚用户修改
- PreToolUse：可用 `exit(2)` 阻断

## 闭环设计

- 写入端和读取端必须使用相同的路径转换逻辑
- 经验沉淀：PostToolUse → learnings.md → SessionStart
- 数据度量：PostToolUse → metrics.json → Stop
