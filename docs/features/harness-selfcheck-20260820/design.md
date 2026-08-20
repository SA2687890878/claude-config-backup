# Harness 自检 Demo - 技术方案

## 影响半径
- tasks/active.json（写入 demo 任务）
- tasks/.index.json（首条历史）
- docs/features/harness-selfcheck-20260820/（产物目录）

## 变更清单
| 文件 | 动作 | 验证 |
|------|------|------|
| tasks/active.json | 写入 stage=done | 文件存在 |
| tasks/.index.json | 追加 task | git diff 可见 |
| docs/features/.../requirements.md | 已创建 | 文件存在 |

## 验证手段
- active.json 含 task 且 stage=done
- .index.json tasks 非空
- git log 含 demo 提交

## 风险
- 无业务影响，仅验证流程