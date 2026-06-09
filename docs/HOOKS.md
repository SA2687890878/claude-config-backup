# Hook 工作原理

> 理解 Hook 的触发时机、执行流程和检查内容。

---

## Hook 类型

| 类型 | 触发时机 | 用途 |
|------|----------|------|
| **PreToolUse** | 工具执行前 | 拦截危险操作、提醒注意事项 |
| **PostToolUse** | 工具执行后 | 检查代码质量、提示构建 |
| **SessionStart** | 会话启动时 | 初始化环境 |
| **UserPromptSubmit** | 用户输入时 | 处理用户输入 |

---

## 执行流程

```
用户输入 / Claude 调用工具
    │
    ├─→ PreToolUse Hook（执行前）
    │   │
    │   ├─→ Secret Guard：检查密钥泄露
    │   │   └─→ 发现密钥？→ 阻断（exit 2）
    │   │
    │   ├─→ Write Guard：检查路径安全
    │   │   └─→ 路径不安全？→ 阻断（exit 2）
    │   │
    │   └─→ Impact Guard：提醒查调用链
    │       └─→ 修改现有代码？→ 提醒（不阻断）
    │
    ├─→ 工具执行（Write/Edit/Bash）
    │
    └─→ PostToolUse Hook（执行后）
        │
        ├─→ CS Guard：检查 C# 语法
        │   └─→ 花括号不匹配？→ 警告
        │
        ├─→ Quality Guard：检查最佳实践
        │   └─→ SQL 注入/Null 安全/资源释放？→ 警告
        │
        ├─→ Build Guard：提示构建
        │   └─→ 修改了 .cs 文件？→ 提示运行 build
        │
        └─→ SQLite Index Update ⭐：自动索引更新（加密源码项目）
            └─→ 修改了 .cs 文件？→ 后台触发 update.ps1 更新 SQLite 索引
```

---

## Hook 详细说明

### PreToolUse（执行前）

#### Secret Guard
- **触发**：Write/Edit/Bash
- **检查**：硬编码密钥、密码、Token
- **动作**：发现则阻断（exit 2）
- **示例**：
  ```csharp
  // ❌ 会被拦截
  var password = "123456";
  var apiKey = "sk-abc123...";
  ```

#### Write Guard
- **触发**：Write/Edit
- **检查**：文件路径是否安全
- **动作**：路径不安全则阻断（exit 2）
- **示例**：
  ```
  ❌ 在用户主目录根下创建文件
  ✅ 在项目目录下创建文件
  ```

#### Impact Guard
- **触发**：Edit（修改现有文件）
- **检查**：是否修改 .cs 文件
- **动作**：提醒查调用链（不阻断）
- **示例**：
  ```
  [Impact Guard] 正在修改 UserService.cs — 建议先运行 codegraph_callers 查看调用链
  ```

---

### PostToolUse（执行后）

#### CS Guard
- **触发**：Write/Edit .cs 文件
- **检查**：
  - 花括号匹配
  - async 方法有 await
  - 没有空 catch 块
  - 没有 .Result/.Wait()
- **动作**：发现问题则警告
- **示例**：
  ```
  [C# Guard] UserService.cs:
    ⚠ Brace mismatch: { = 5, } = 4
    ⚠ Async method without await
  ```

#### Quality Guard
- **触发**：Write/Edit .cs 文件
- **检查**：
  - SQL 注入风险
  - 硬编码 IP/端口
  - Null 安全（Find/FirstOrDefault 后检查）
  - 资源释放（using）
  - CancellationToken
  - 异常处理（空 catch 块）
- **动作**：发现问题则警告
- **示例**：
  ```
  [Quality Guard] UserService.cs:
    ⚠ Find/FirstOrDefault 后未检查 null（第 4 行）
    ⚠ 资源未 using 释放（第 8 行）
    ⚠ async 方法缺少 CancellationToken（第 2 行）
    ⚠ catch (Exception) 块为空（第 11 行）— 至少记录日志
  ```

#### Build Guard
- **触发**：Write/Edit .cs 文件
- **检查**：是否修改了 .cs 文件
- **动作**：提示运行 build
- **示例**：
  ```
  [Build Guard] 已修改 UserService.cs — 建议运行: rtk dotnet build
  ```

#### SQLite Index Update ⭐
- **触发**：Write/Edit .cs 文件（属于已配置的项目根）
- **检查**：向上查找最近的 `.csproj` 目录确定项目路径
- **动作**：fire-and-forget 后台触发 `update.ps1` 增量更新 SQLite 索引
- **特点**：不阻塞主流程（`detached: true`），失败静默处理
- **示例**：
  ```
  [SQLite Index] 已触发增量更新：otd.pcs.webbackend
  ```

#### Git Commit Review（PreToolUse）
- **触发**：Bash 命令包含 `git commit` / `git push` / `git reset --hard`
- **检查**：force push、受保护分支、提交信息中的密钥、跳过钩子
- **动作**：输出安全提醒（不阻断）

---

## 配置位置

Hook 配置在 `settings.json` 的 `hooks` 字段：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node ~/.claude/hooks/secret-guard.js", "timeout": 10 },
          { "type": "command", "command": "node ~/.claude/hooks/write-guard.js", "timeout": 10 },
          { "type": "command", "command": "node ~/.claude/hooks/impact-guard.js", "timeout": 10 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node ~/.claude/hooks/cs-guard.js", "timeout": 25 },
          { "type": "command", "command": "node ~/.claude/hooks/quality-guard.js", "timeout": 15 },
          { "type": "command", "command": "node ~/.claude/hooks/build-guard.js", "timeout": 15 }
        ]
      }
    ]
  }
}
```

---

## 自定义 Hook

### 创建 Hook 文件

```javascript
#!/usr/bin/env node
/**
 * My Hook (PreToolUse/PostToolUse)
 * 说明：...
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolName = input.tool_name || '';

    // 只处理特定工具
    if (toolName !== 'Write' && toolName !== 'Edit') return;

    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    // 你的检查逻辑
    if (有问题) {
      console.error('[My Hook] 警告信息');  // 用户可见
      // process.exit(2);  // 阻断（仅 PreToolUse）
    }
  } catch (e) { }
});
```

### 注册 Hook

在 `settings.json` 的 `hooks` 中添加：

```json
{
  "matcher": "Write|Edit",
  "hooks": [
    { "type": "command", "command": "node ~/.claude/hooks/my-hook.js", "timeout": 10 }
  ]
}
```

---

## 调试 Hook

### 测试 Hook

```bash
# 模拟输入
echo '{"tool_name":"Write","tool_input":{"file_path":"test.cs","content":"..."}}' | node ~/.claude/hooks/my-hook.js
```

### 查看 Hook 输出

Hook 的 stderr 输出会显示给用户，stdout 输出会注入到 Claude 的上下文。

---

## 最佳实践

| 实践 | 说明 |
|------|------|
| **PreToolUse 用于阻断** | 发现严重问题时阻止执行 |
| **PostToolUse 用于警告** | 发现问题时提醒用户 |
| **保持 Hook 快速** | timeout 不要太长 |
| **只检查必要的** | 不要过度检查 |
| **错误处理** | 用 try-catch 包裹逻辑 |
