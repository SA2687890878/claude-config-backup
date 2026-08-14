[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
$focusScript = Join-Path $hookDir "focus-window.ps1"
$iconPath = Join-Path $hookDir "claude.ico"

if (-not (Test-Path -LiteralPath $focusScript)) {
    throw "focus-window.ps1 not found: $focusScript"
}

$protocolRoot = "HKCU:\Software\Classes\claude-focus"
$commandKey = Join-Path $protocolRoot "shell\open\command"
$iconKey = Join-Path $protocolRoot "DefaultIcon"

New-Item -Path $protocolRoot -Force | Out-Null
Set-Item -Path $protocolRoot -Value "URL:claude-focus Protocol"
New-ItemProperty -Path $protocolRoot -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null

if (Test-Path -LiteralPath $iconPath) {
    New-Item -Path $iconKey -Force | Out-Null
    Set-Item -Path $iconKey -Value $iconPath
}

New-Item -Path $commandKey -Force | Out-Null

# The Windows shell passes the full claude-focus:// URI as %1. focus-window.ps1
# accepts that URI in -sid and extracts the sid query parameter itself.
$command = 'powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $focusScript + '" -sid "%1"'
Set-Item -Path $commandKey -Value $command

Write-Output "Registered claude-focus:// protocol"
Write-Output "Command: $command"
