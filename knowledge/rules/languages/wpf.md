---
paths:
  - "**/*.xaml"
  - "**/*.xaml.cs"
  - "**/*Wpf*.csproj"
---

# WPF 按需规则

## 线程与生命周期

- UI 线程不得执行网络、文件、数据库或大数据解析。
- 后台任务更新 UI 必须通过正确的 Dispatcher/同步上下文。
- 事件、定时器、后台任务和订阅必须有释放/取消路径。

## 分层与交互

- View 负责展示，ViewModel 负责状态和命令，Service 负责外部调用。
- 设备/网络/数据库调用不得直接散落在 View 或 code-behind。
- 绑定路径和模式必须可验证；禁止无效绑定和重复状态来源。
- 操作按钮需防重复点击；成功、失败、超时都要有明确反馈。
- 多语言文本进入资源，不散落在界面代码。

## 外部边界

- 网络和设备调用必须有超时、取消和失败处理。
- 空数据、异常数据和断网场景不得导致 UI 崩溃。
- 设备通信日志记录必要结果和耗时，敏感字段按全局安全规则处理。

## 审查触发

改动 XAML、ViewModel、设备调用或异步 UI 逻辑时，按需读取：

- `knowledge/rules/quality/review-checklist.md`
- `knowledge/rules/quality/logging-observability.md`（涉及日志时）
- `knowledge/project/sanhua/pcs-device.md`（三花设备项目时）
