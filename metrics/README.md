# 度量系统

> 自动记录 Claude Code 使用统计，帮助优化工作流。

## 目录结构

```
metrics/
├── daily/              # 每日汇总
│   └── 2026-06-15.json
├── sessions/           # 每会话详情（预留）
│   └── <session-id>.json
└── README.md           # 本文件
```

## 数据格式

### daily/<date>.json

```json
{
  "date": "2026-06-15",
  "tools": {
    "Bash": {
      "count": 45,
      "firstCall": "2026-06-15T10:00:00Z",
      "lastCall": "2026-06-15T18:30:00Z"
    },
    "Read": {
      "count": 120,
      "firstCall": "2026-06-15T10:00:00Z",
      "lastCall": "2026-06-15T18:25:00Z"
    }
  },
  "totalCalls": 200,
  "firstCall": "2026-06-15T10:00:00Z",
  "lastCall": "2026-06-15T18:30:00Z"
}
```

## 收集的指标

| 指标 | 说明 |
|------|------|
| 工具调用次数 | 每个工具被调用的次数 |
| 首次/末次调用 | 会话时间范围 |
| 总调用次数 | 所有工具的调用总和 |

## 报告

会话结束时，`metrics-report.js` 会自动输出今日度量报告到 stderr。

## 隐私

- 只记录工具调用统计，不记录具体内容
- 数据存储在本地 `~/.claude/metrics/` 目录
- 不会上传到任何外部服务
