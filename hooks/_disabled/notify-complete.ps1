<#
.SYNOPSIS
    Claude Code 任务完成通知脚本

.DESCRIPTION
    当 Claude Code 完成任务时，播放声音并发送 Windows Toast 通知。

.EXAMPLE
    .\notify-complete.ps1
#>

# 播放声音
[System.Media.SystemSounds]::Asterisk.Play()

# 发送 Toast 通知
try {
    # 尝试使用 BurntToast 模块
    if (Get-Module -ListAvailable -Name BurntToast) {
        New-BurntToastNotification -Text "Claude Code", "任务已完成！" -ErrorAction Stop
    } else {
        throw "BurntToast not installed"
    }
} catch {
    # 使用 Balloon 提示作为备选方案
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Information
        $notify.BalloonTipTitle = "Claude Code"
        $notify.BalloonTipText = "任务已完成！"
        $notify.Visible = $true
        $notify.ShowBalloonTip(5000)

        # 等待通知显示后清理
        Start-Sleep -Seconds 6
        $notify.Dispose()
    } catch {
        # 如果所有方法都失败，只播放声音
        Write-Host "Claude Code 任务已完成！" -ForegroundColor Green
    }
}
