# Copilot Hooks（基于 Claude Hooks 映射）

- 主配置：`claude-parity.copilot.json`
- 兼容桥接：`copilot-hook-bridge.js`

## 设计说明

1. 不修改现有 `hooks/*.js`（Claude 原脚本保持不动）
2. 在 Copilot 侧做输入适配：
   - 工具名映射（如 `create_file` / `apply_patch` / `run_in_terminal` → `Write/Edit/Bash`）
   - 字段映射（`filePath` → `file_path`）
3. 复用现有 Claude hooks 脚本，保证规则一致

## 注意

- 该方案依赖仓库根目录下的 `hooks/` 脚本存在。
- 若新增或删除 Claude 脚本，请同步更新 `copilot-hook-bridge.js` 的路由表。
