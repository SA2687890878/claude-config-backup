# Claude 全局配置自动备份脚本
# 用法: pwsh -ExecutionPolicy Bypass -File backup.ps1
# 建议: 加入 Windows 计划任务，每小时执行一次

$ErrorActionPreference = "Stop"
$claudeDir = "C:\Users\admin\.claude"

Set-Location $claudeDir

# 检查是否有变更
$status = git status --porcelain 2>&1
if (-not $status) {
    Write-Host "[backup] 无变更，跳过" -ForegroundColor Gray
    exit 0
}

# 统计变更
$changes = ($status | Measure-Object -Line).Lines
Write-Host "[backup] 检测到 $changes 个文件变更" -ForegroundColor Yellow

# 添加所有变更
git add -A 2>&1 | Out-Null

# 生成提交信息
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$summary = @()
if ($status -match "M\s+(.+\.js)") { $summary += "hooks" }
if ($status -match "M\s+(.+\.md)") { $summary += "docs" }
if ($status -match "M\s+(.+\.json)") { $summary += "config" }
if ($status -match "A\s+(.+)") { $summary += "new" }
if ($status -match "D\s+(.+)") { $summary += "del" }

$msg = "[auto-backup] $timestamp"
if ($summary.Count -gt 0) {
    $msg += " ($($summary -join ', '))"
}

# 提交
git commit -m $msg 2>&1 | Out-Null

# 推送（失败不阻断）
$pushResult = git push 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[backup] 已提交并推送 ($changes 个文件)" -ForegroundColor Green
} else {
    Write-Host "[backup] 已提交但推送失败，下次重试" -ForegroundColor Yellow
}
