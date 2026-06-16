# RTK 自动压缩

## 配置

`rtk hook claude` 已配置，每次 Bash 调用前自动压缩输出。

## 使用方式

- 默认情况下，RTK 会自动压缩 Bash 命令的输出
- 需要绕过时用 `rtk proxy <cmd>`

## 查看节省情况

```bash
rtk gain              # 查看 token 节省统计
rtk gain --history    # 查看历史命令
rtk discover          # 分析未使用 RTK 的机会
```

## How to apply

- 日常使用中，RTK 会自动压缩输出
- 需要查看完整输出时，使用 `rtk proxy <cmd>`
- 定期查看 `rtk gain` 了解节省情况
