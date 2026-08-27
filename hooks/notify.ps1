[CmdletBinding()]
param(
    [string]$Title = "Claude Code",
    [AllowEmptyString()]
    [string]$Message = $null,
    [ValidateSet("input", "permission", "done")]
    [string]$Type = "input",
    [switch]$ToastAgent,
    [string]$Sid,
    [string]$AgentTitleB64,
    [string]$AgentMessageB64,
    [string]$AgentWindowB64
)

$ErrorActionPreference = "Stop"

# Dot-source modules
$moduleDir = Join-Path $PSScriptRoot "modules"
. (Join-Path $moduleDir "WindowManagement.ps1")
. (Join-Path $moduleDir "JsonUtils.ps1")
. (Join-Path $moduleDir "NotificationLogic.ps1")
. (Join-Path $moduleDir "ToastNotification.ps1")

$hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
$statePath = Join-Path $hookDir "window-state.json"

function New-UnicodeString {
    param([int[]]$CodePoints)

    return -join ($CodePoints | ForEach-Object { [char]$_ })
}

if ([string]::IsNullOrEmpty($Message)) {
    $Message = New-UnicodeString @(0x9700, 0x8981, 0x4F60, 0x5904, 0x7406)
}

if ($ToastAgent) {
    $agentTitle = ConvertFrom-Base64Utf8 $AgentTitleB64
    $agentMessage = ConvertFrom-Base64Utf8 $AgentMessageB64
    $agentWindow = ConvertFrom-Base64Utf8 $AgentWindowB64
    Send-ClaudeToast -Sid $Sid -ToastTitle $agentTitle -ToastMessage $agentMessage -WindowDisplayName $agentWindow
    exit 0
}

New-Item -ItemType Directory -Path $hookDir -Force | Out-Null
Add-ClaudeWindowNativeTypes

$sid = [guid]::NewGuid().ToString("N")
$currentProcess = Get-Process -Id $PID -ErrorAction Stop
$parentPid = Get-ParentProcessId -ProcessId $PID
$processChain = Get-ProcessChain -StartPid $PID
$consoleHwnd = [ClaudeCodeNotifyWin32]::GetConsoleWindow()
$foregroundHwnd = [ClaudeCodeNotifyWin32]::GetForegroundWindow()
$candidate = Get-CandidateWindow -ProcessChain $processChain -ConsoleHwnd $consoleHwnd -ForegroundHwnd $foregroundHwnd

$selectedHwnd = 0
$selectedPid = 0
$selectedTitle = ""
$selectedSource = ""
if ($candidate) {
    $selectedHwnd = [int64]$candidate.hwnd
    $selectedPid = [int]$candidate.pid
    $selectedTitle = [string]$candidate.title
    $selectedSource = [string]$candidate.source
}

$foregroundPid = Get-WindowPid -Hwnd $foregroundHwnd
$foregroundTitle = Get-WindowTitle -Hwnd $foregroundHwnd
$windowDisplayName = Get-WindowDisplayName -WindowPid $selectedPid -WindowTitle $selectedTitle -ProcessChain $processChain

$record = [ordered]@{
    sid             = $sid
    createdAt       = (Get-Date).ToString("o")
    type            = $Type
    title           = $Title
    message         = $Message
    pid             = [int]$PID
    processName     = [string]$currentProcess.ProcessName
    parentPid       = [int]$parentPid
    hwnd            = [int64]$selectedHwnd
    hwndHex         = if ($selectedHwnd -ne 0) { "0x{0:X}" -f $selectedHwnd } else { "" }
    hwndPid         = [int]$selectedPid
    hwndSource      = $selectedSource
    windowTitle     = $selectedTitle
    windowDisplayName = $windowDisplayName
    consoleHwnd     = [int64]$consoleHwnd
    foregroundHwnd  = [int64]$foregroundHwnd
    foregroundPid   = [int]$foregroundPid
    foregroundTitle = [string]$foregroundTitle
    processChain    = @($processChain)
}

$suppressNotification = $false
$suppressionReason = ""

$mutex = New-Object System.Threading.Mutex($false, "Local\ClaudeCodeWindowState")
$hasLock = $false
try {
    $hasLock = $mutex.WaitOne(5000)
    if (-not $hasLock) {
        throw "Timed out waiting for the window-state.json write lock."
    }

    $state = Read-WindowState -Path $statePath
    $suppression = Test-ShouldSuppressNotification -CurrentType $Type -CurrentRecord $record -Sessions $state["sessions"]
    $suppressNotification = [bool]$suppression.Suppress
    $suppressionReason = [string]$suppression.Reason
    $record["suppressed"] = $suppressNotification
    if ($suppressNotification) {
        $record["suppressionReason"] = $suppressionReason
    }

    $state["updatedAt"] = (Get-Date).ToString("o")
    $state["sessions"][$sid] = $record
    Write-JsonFileAtomically -Path $statePath -Data $state
} finally {
    if ($hasLock) {
        [void]$mutex.ReleaseMutex()
    }
    $mutex.Dispose()
}

if ($suppressNotification) {
    Write-ToastAgentLog "toast suppressed sid=$sid type=$Type reason=$suppressionReason display=$windowDisplayName"
    Write-Output "Toast suppressed: sid=$sid; type=$Type; reason=$suppressionReason"
    exit 0
}

Start-ClaudeToastAgent -AgentSid $sid -AgentTitle $Title -AgentMessage $Message -AgentWindowName $windowDisplayName



