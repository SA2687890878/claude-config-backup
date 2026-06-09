param([string]$FilePath)
$content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
Write-Output $content
