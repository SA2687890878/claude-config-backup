# Claude 全局配置恢复脚本
# 用法: pwsh -ExecutionPolicy Bypass -File restore.ps1
# 从 git 恢复所有被删除/修改的文件

$ErrorActionPreference = "Stop"
$claudeDir = "C:\Users\admin\.claude"

Set-Location $claudeDir

Write-Host "=== Claude 配置恢复工具 ===" -ForegroundColor Cyan
Write-Host ""

# 显示当前状态
Write-Host "当前 git 状态:" -ForegroundColor Yellow
git status --short 2>&1
Write-Host ""

# 列出可恢复的文件
$modified = git diff --name-only 2>&1
$deleted = git ls-files --deleted 2>&1

if (-not $modified -and -not $deleted) {
    Write-Host "没有需要恢复的文件" -ForegroundColor Green
    exit 0
}

if ($modified) {
    Write-Host "已修改的文件:" -ForegroundColor Yellow
    $modified | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}

if ($deleted) {
    Write-Host "已删除的文件:" -ForegroundColor Red
    $deleted | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
}

# 确认恢复
$confirm = Read-Host "确认恢复所有文件? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "已取消" -ForegroundColor Gray
    exit 0
}

# 恢复
git checkout HEAD -- . 2>&1
Write-Host ""
Write-Host "恢复完成!" -ForegroundColor Green

# 显示恢复结果
git status --short 2>&1
