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

# 推送到 GitHub（失败不阻断）
$pushResult = git push 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[backup] 已提交并推送到 GitHub ($changes 个文件)" -ForegroundColor Green
} else {
    Write-Host "[backup] 已提交但推送失败，下次重试" -ForegroundColor Yellow
}

# 同步快照到 GitLab（如果已配置 gitlab 远程）
$gitlabRemote = git remote get-url gitlab 2>$null
if ($LASTEXITCODE -ne 0 -or -not $gitlabRemote) {
    Write-Host "[backup] 未配置 gitlab 远程，跳过 GitLab 同步" -ForegroundColor Gray
    exit 0
}

# 先抓取 GitLab 当前 master，作为快照提交的父提交，保证后续推送是快进而非强推
git fetch gitlab master:refs/remotes/gitlab/master-sync 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[backup] 读取 GitLab master 失败，跳过 GitLab 同步" -ForegroundColor Yellow
    exit 0
}

$parentCommit = git rev-parse refs/remotes/gitlab/master-sync 2>&1
if ($LASTEXITCODE -ne 0 -or -not $parentCommit) {
    Write-Host "[backup] 解析 GitLab master 提交失败，跳过 GitLab 同步" -ForegroundColor Yellow
    exit 0
}

$snapshotMessage = "[配置] 自动同步 Claude 配置快照"

$tree = git write-tree 2>&1
if ($LASTEXITCODE -ne 0 -or -not $tree) {
    Write-Host "[backup] 生成 GitLab 快照树失败，跳过 GitLab 同步" -ForegroundColor Yellow
    exit 0
}

$snapshotCommit = git commit-tree $tree -p $parentCommit -m $snapshotMessage 2>&1
if ($LASTEXITCODE -ne 0 -or -not $snapshotCommit) {
    Write-Host "[backup] 生成 GitLab 快照提交失败，跳过 GitLab 同步" -ForegroundColor Yellow
    exit 0
}

$gitlabPush = git push gitlab "$snapshotCommit`:refs/heads/master" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[backup] 已同步快照到 GitLab master" -ForegroundColor Green
} else {
    Write-Host "[backup] GitLab 推送失败，下次重试" -ForegroundColor Yellow
}
