#!/bin/bash
# Claude Code 任务完成通知脚本
# 用于 Stop hook 调用

# 执行 PowerShell 通知脚本
powershell -ExecutionPolicy Bypass -File "$HOME/.claude/hooks/notify-complete.ps1" &

# 立即返回，不阻塞 Claude Code
exit 0
