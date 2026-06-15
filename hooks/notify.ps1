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

$hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
$statePath = Join-Path $hookDir "window-state.json"
$toastPngPath = Join-Path $hookDir "claude-toast.png"
$toastIcoPath = Join-Path $hookDir "claude.ico"
$iconPath = if (Test-Path -LiteralPath $toastPngPath) { $toastPngPath } else { $toastIcoPath }

function New-UnicodeString {
    param([int[]]$CodePoints)

    return -join ($CodePoints | ForEach-Object { [char]$_ })
}

if ([string]::IsNullOrEmpty($Message)) {
    $Message = New-UnicodeString @(0x9700, 0x8981, 0x4F60, 0x5904, 0x7406)
}

function Add-ClaudeWindowNativeTypes {
    if ("ClaudeCodeNotifyWin32" -as [type]) {
        return
    }

    Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class ClaudeCodeNotifyWin32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
}
"@
}

function Get-WindowTitle {
    param([IntPtr]$Hwnd)

    if ($Hwnd -eq [IntPtr]::Zero -or -not [ClaudeCodeNotifyWin32]::IsWindow($Hwnd)) {
        return ""
    }

    $buffer = New-Object System.Text.StringBuilder 1024
    [void][ClaudeCodeNotifyWin32]::GetWindowText($Hwnd, $buffer, $buffer.Capacity)
    return $buffer.ToString()
}

function Get-WindowPid {
    param([IntPtr]$Hwnd)

    if ($Hwnd -eq [IntPtr]::Zero -or -not [ClaudeCodeNotifyWin32]::IsWindow($Hwnd)) {
        return 0
    }

    [uint32]$pidValue = 0
    [void][ClaudeCodeNotifyWin32]::GetWindowThreadProcessId($Hwnd, [ref]$pidValue)
    return [int]$pidValue
}

function Get-ParentProcessId {
    param([int]$ProcessId)

    try {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction Stop
        if ($proc) {
            return [int]$proc.ParentProcessId
        }
    } catch {
        try {
            $proc = Get-WmiObject Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction Stop
            if ($proc) {
                return [int]$proc.ParentProcessId
            }
        } catch {
            return 0
        }
    }

    return 0
}

function Get-ProcessSnapshot {
    param([int]$ProcessId)

    $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $proc) {
        return $null
    }

    return [ordered]@{
        pid              = [int]$proc.Id
        processName      = [string]$proc.ProcessName
        mainWindowHandle = [int64]$proc.MainWindowHandle
        mainWindowTitle  = [string]$proc.MainWindowTitle
    }
}

function Get-FriendlyProcessName {
    param([string]$ProcessName)

    switch -Regex ($ProcessName) {
        '^WindowsTerminal(Preview)?$' { return "Windows Terminal" }
        '^wt$' { return "Windows Terminal" }
        '^powershell$' { return "Windows PowerShell" }
        '^pwsh$' { return "PowerShell 7" }
        '^cmd$' { return "Command Prompt" }
        default {
            if ([string]::IsNullOrWhiteSpace($ProcessName)) {
                return "PowerShell"
            }
            return $ProcessName
        }
    }
}



function Remove-TextPrefix {
    param(
        [string]$Text,
        [string]$Prefix
    )

    if ([string]::IsNullOrWhiteSpace($Text) -or [string]::IsNullOrWhiteSpace($Prefix)) {
        return $Text
    }

    $value = $Text.Trim()
    if (-not $value.StartsWith($Prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $value
    }

    $rest = $value.Substring($Prefix.Length).TrimStart()
    $separators = @("-", [string][char]0x2013, [string][char]0x2014, ":", [string][char]0xFF1A)
    foreach ($separator in $separators) {
        if ($rest.StartsWith($separator, [System.StringComparison]::Ordinal)) {
            return $rest.Substring($separator.Length).TrimStart()
        }
    }

    return $value
}

function Get-ShortWindowTitle {
    param([string]$Title)

    if ([string]::IsNullOrWhiteSpace($Title)) {
        return ""
    }

    $short = $Title.Trim()
    $windowZh = -join ([char]0x7A97, [char]0x53E3)
    $prefixes = @(
        "window",
        $windowZh,
        "windows terminal",
        "terminal",
        "powershell 7",
        "windows powershell",
        "powershell"
    )

    $changed = $true
    while ($changed) {
        $changed = $false
        foreach ($prefix in $prefixes) {
            $newValue = Remove-TextPrefix -Text $short -Prefix $prefix
            if ($newValue -ne $short) {
                $short = $newValue.Trim()
                $changed = $true
            }
        }
    }

    return $short
}

function Get-WindowDisplayName {
    param(
        [int]$WindowPid,
        [string]$WindowTitle,
        [object[]]$ProcessChain
    )

    $shortTitle = Get-ShortWindowTitle -Title $WindowTitle
    if (-not [string]::IsNullOrWhiteSpace($shortTitle)) {
        return $shortTitle
    }

    $processName = ""
    try {
        if ($WindowPid -gt 0) {
            $processName = (Get-Process -Id $WindowPid -ErrorAction Stop).ProcessName
        }
    } catch {
        $processName = ""
    }

    if ([string]::IsNullOrWhiteSpace($processName) -and $ProcessChain) {
        foreach ($item in @($ProcessChain)) {
            if ($item.processName -match '^(powershell|pwsh|cmd|wt|WindowsTerminal|WindowsTerminalPreview)$') {
                $processName = [string]$item.processName
                break
            }
        }
    }

    return (Get-FriendlyProcessName -ProcessName $processName)
}

function Get-ProcessChain {
    param([int]$StartPid)

    $items = @()
    $seen = @{}
    $currentPid = $StartPid

    while ($currentPid -gt 0 -and -not $seen.ContainsKey($currentPid)) {
        $seen[$currentPid] = $true
        $snapshot = Get-ProcessSnapshot -ProcessId $currentPid
        if ($snapshot) {
            $items += [pscustomobject]$snapshot
        }

        $currentPid = Get-ParentProcessId -ProcessId $currentPid
    }

    return @($items)
}

function ConvertTo-PlainData {
    param($Value)

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [string] -or $Value.GetType().IsPrimitive -or $Value -is [decimal]) {
        return $Value
    }

    if ($Value -is [System.Collections.IDictionary]) {
        $table = [ordered]@{}
        foreach ($key in $Value.Keys) {
            $table[[string]$key] = ConvertTo-PlainData $Value[$key]
        }
        return $table
    }

    if ($Value -is [System.Management.Automation.PSCustomObject]) {
        $table = [ordered]@{}
        foreach ($prop in $Value.PSObject.Properties) {
            $table[$prop.Name] = ConvertTo-PlainData $prop.Value
        }
        return $table
    }

    if ($Value -is [System.Collections.IEnumerable]) {
        $list = @()
        foreach ($item in $Value) {
            $list += (ConvertTo-PlainData $item)
        }
        return @($list)
    }

    return $Value
}

function Read-WindowState {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return [ordered]@{
            version  = 1
            sessions = [ordered]@{}
        }
    }

    $raw = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return [ordered]@{
            version  = 1
            sessions = [ordered]@{}
        }
    }

    try {
        $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
    } catch {
        throw "window-state.json parse failed; stopped without overwriting the original file: $($_.Exception.Message)"
    }

    $state = ConvertTo-PlainData $parsed
    if (-not ($state -is [System.Collections.IDictionary])) {
        throw "window-state.json root is not a JSON object; stopped without writing."
    }

    if (-not $state.Contains("sessions")) {
        $state["sessions"] = [ordered]@{}
    }

    if (-not ($state["sessions"] -is [System.Collections.IDictionary])) {
        throw "window-state.json sessions field is not a JSON object; stopped without writing."
    }

    if (-not $state.Contains("version")) {
        $state["version"] = 1
    }

    return $state
}

function Write-JsonFileAtomically {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Data
    )

    $directory = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $directory)) {
        [void](New-Item -ItemType Directory -Path $directory -Force)
    }

    $tmpPath = Join-Path $directory (".{0}.{1}.tmp" -f [IO.Path]::GetFileName($Path), [guid]::NewGuid().ToString("N"))
    $json = $Data | ConvertTo-Json -Depth 32
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmpPath, $json, $utf8NoBom)
    Move-Item -LiteralPath $tmpPath -Destination $Path -Force
}

function Get-CandidateWindow {
    param(
        [object[]]$ProcessChain,
        [IntPtr]$ConsoleHwnd,
        [IntPtr]$ForegroundHwnd
    )

    $terminalNames = @("powershell", "pwsh", "cmd", "wt", "WindowsTerminal", "WindowsTerminalPreview")
    $chainPids = @{}
    foreach ($item in @($ProcessChain)) {
        try {
            $pidValue = [int]$item.pid
            if ($pidValue -gt 0 -and -not $chainPids.ContainsKey($pidValue)) {
                $chainPids[$pidValue] = $true
            }
        } catch {}
    }

    $candidates = New-Object System.Collections.ArrayList

    if ($ConsoleHwnd -ne [IntPtr]::Zero) {
        $null = $candidates.Add([pscustomobject]@{
            priority = 10
            source   = "console"
            hwnd     = [int64]$ConsoleHwnd
            pid      = Get-WindowPid -Hwnd $ConsoleHwnd
            title    = Get-WindowTitle -Hwnd $ConsoleHwnd
        })
    }

    $visibleWindows = New-Object System.Collections.ArrayList
    $callback = [ClaudeCodeNotifyWin32+EnumWindowsProc]{
        param([IntPtr]$hwnd, [IntPtr]$lParam)

        if ([ClaudeCodeNotifyWin32]::IsWindowVisible($hwnd)) {
            $title = Get-WindowTitle -Hwnd $hwnd
            if (-not [string]::IsNullOrWhiteSpace($title)) {
                $pidValue = Get-WindowPid -Hwnd $hwnd
                $processName = ""
                try {
                    $processName = (Get-Process -Id $pidValue -ErrorAction Stop).ProcessName
                } catch {
                    $processName = ""
                }

                $null = $visibleWindows.Add([pscustomobject]@{
                    hwnd        = [int64]$hwnd
                    pid         = [int]$pidValue
                    processName = [string]$processName
                    title       = [string]$title
                })
            }
        }

        return $true
    }
    [void][ClaudeCodeNotifyWin32]::EnumWindows($callback, [IntPtr]::Zero)

    foreach ($window in @($visibleWindows)) {
        if (($terminalNames -contains $window.processName) -and $chainPids.ContainsKey([int]$window.pid)) {
            $priority = 12
            $null = $candidates.Add([pscustomobject]@{
                priority = $priority
                source   = "process-chain-window"
                hwnd     = [int64]$window.hwnd
                pid      = [int]$window.pid
                title    = [string]$window.title
            })
        }
    }

    foreach ($item in @($ProcessChain)) {
        if (($terminalNames -contains $item.processName) -and $item.mainWindowHandle -and [int64]$item.mainWindowHandle -ne 0) {
            $rank = "terminal-process"
            $priority = 20
            $null = $candidates.Add([pscustomobject]@{
                priority = $priority
                source   = $rank
                hwnd     = [int64]$item.mainWindowHandle
                pid      = [int]$item.pid
                title    = [string]$item.mainWindowTitle
            })
        }
    }

    if ($ForegroundHwnd -ne [IntPtr]::Zero) {
        $foregroundPid = Get-WindowPid -Hwnd $ForegroundHwnd
        $foregroundProcessName = ""
        try {
            $foregroundProcessName = (Get-Process -Id $foregroundPid -ErrorAction Stop).ProcessName
        } catch {
            $foregroundProcessName = ""
        }

        if ($terminalNames -contains $foregroundProcessName) {
            $priority = 60
            $null = $candidates.Add([pscustomobject]@{
                priority = $priority
                source   = "foreground-terminal"
                hwnd     = [int64]$ForegroundHwnd
                pid      = [int]$foregroundPid
                title    = Get-WindowTitle -Hwnd $ForegroundHwnd
            })
        }
    }

    $terminalWindows = @($visibleWindows | Where-Object { $terminalNames -contains $_.processName })
    if ($terminalWindows.Count -eq 1) {
        $window = $terminalWindows[0]
        $null = $candidates.Add([pscustomobject]@{
            priority = 80
            source   = "single-terminal-fallback"
            hwnd     = [int64]$window.hwnd
            pid      = [int]$window.pid
            title    = [string]$window.title
        })
    }

    foreach ($candidate in @($candidates | Sort-Object priority)) {
        $hwnd = [IntPtr]([int64]$candidate.hwnd)
        if ($hwnd -ne [IntPtr]::Zero -and [ClaudeCodeNotifyWin32]::IsWindow($hwnd) -and -not [string]::IsNullOrWhiteSpace($candidate.title)) {
            return $candidate
        }
    }

    foreach ($candidate in @($candidates | Sort-Object priority)) {
        $hwnd = [IntPtr]([int64]$candidate.hwnd)
        if ($hwnd -ne [IntPtr]::Zero -and [ClaudeCodeNotifyWin32]::IsWindow($hwnd)) {
            return $candidate
        }
    }

    return $null
}

function Ensure-BurntToast {
    $module = Get-Module -ListAvailable -Name BurntToast | Sort-Object Version -Descending | Select-Object -First 1
    $modulePath = if ($module) { $module.Path } else { $null }

    if (-not $modulePath) {
        $documentRoots = @(
            (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "PowerShell\Modules\BurntToast"),
            (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "WindowsPowerShell\Modules\BurntToast")
        )

        foreach ($root in $documentRoots) {
            if (Test-Path -LiteralPath $root) {
                $candidate = Get-ChildItem -LiteralPath $root -Filter "BurntToast.psd1" -Recurse -ErrorAction SilentlyContinue |
                    Sort-Object FullName -Descending |
                    Select-Object -First 1
                if ($candidate) {
                    $modulePath = $candidate.FullName
                    break
                }
            }
        }
    }

    if (-not $modulePath) {
        Write-Host "BurntToast is not installed; running: Install-Module BurntToast -Scope CurrentUser -Force"
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        } catch {
            # PowerShell 7 on newer .NET may not need or allow changing this.
        }

        if (Get-Command Install-PackageProvider -ErrorAction SilentlyContinue) {
            try {
                if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
                    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Scope CurrentUser -Force -Confirm:$false -ErrorAction Stop | Out-Null
                }
            } catch {
                Write-Verbose "NuGet package provider bootstrap failed: $($_.Exception.Message)"
            }
        }

        Install-Module BurntToast -Scope CurrentUser -Force -ErrorAction Stop
        $module = Get-Module -ListAvailable -Name BurntToast | Sort-Object Version -Descending | Select-Object -First 1
        $modulePath = if ($module) { $module.Path } else { $null }
    }

    if ($modulePath) {
        Import-Module $modulePath -ErrorAction Stop
    } else {
        Import-Module BurntToast -ErrorAction Stop
    }
}

function ConvertTo-XmlText {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return [System.Security.SecurityElement]::Escape($Text)
}

function ConvertFrom-Base64Utf8 {
    param([string]$Value)

    if ([string]::IsNullOrEmpty($Value)) {
        return ""
    }

    return [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function ConvertTo-Base64Utf8 {
    param([AllowNull()][string]$Value)

    if ($null -eq $Value) {
        $Value = ""
    }

    return [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Value))
}

function Quote-ProcessArgument {
    param([string]$Value)

    return '"' + ($Value -replace '"', '\"') + '"'
}

function Write-ToastAgentLog {
    param([string]$Text)

    try {
        $path = Join-Path $hookDir "toast-agent.log"
        $line = "{0} pid={1} {2}" -f (Get-Date).ToString("o"), $PID, $Text
        [System.IO.File]::AppendAllText($path, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
    } catch {
        # Logging must never block notifications.
    }
}

function Get-RecordValue {
    param(
        $Record,
        [string]$Name
    )

    if ($null -eq $Record) {
        return $null
    }

    if ($Record -is [System.Collections.IDictionary]) {
        if ($Record.Contains($Name)) {
            return $Record[$Name]
        }

        return $null
    }

    $property = $Record.PSObject.Properties[$Name]
    if ($property) {
        return $property.Value
    }

    return $null
}

function ConvertTo-Int64OrZero {
    param($Value)

    if ($null -eq $Value) {
        return 0
    }

    try {
        return [int64]$Value
    } catch {
        return 0
    }
}

function Get-RecordCreatedAt {
    param($Record)

    $raw = [string](Get-RecordValue -Record $Record -Name "createdAt")
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return $null
    }

    try {
        return [datetime]::Parse($raw, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::RoundtripKind)
    } catch {
        return $null
    }
}

function Test-SameNotificationTarget {
    param(
        $CurrentRecord,
        $ExistingRecord
    )

    $hasComparableText = $false
    foreach ($name in @("windowDisplayName", "windowTitle")) {
        $currentValue = [string](Get-RecordValue -Record $CurrentRecord -Name $name)
        $existingValue = [string](Get-RecordValue -Record $ExistingRecord -Name $name)
        if (-not [string]::IsNullOrWhiteSpace($currentValue) -and -not [string]::IsNullOrWhiteSpace($existingValue)) {
            $hasComparableText = $true
            if ($currentValue.Trim().Equals($existingValue.Trim(), [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
    }

    if ($hasComparableText) {
        return $false
    }

    $currentPid = ConvertTo-Int64OrZero (Get-RecordValue -Record $CurrentRecord -Name "hwndPid")
    $existingPid = ConvertTo-Int64OrZero (Get-RecordValue -Record $ExistingRecord -Name "hwndPid")
    if ($currentPid -gt 0 -and $existingPid -gt 0 -and $currentPid -eq $existingPid) {
        return $true
    }

    return $false
}

function Test-ShouldSuppressNotification {
    param(
        [string]$CurrentType,
        $CurrentRecord,
        $Sessions,
        [int]$QuietSeconds = 600
    )

    if ($CurrentType -ne "input" -or $null -eq $Sessions) {
        return [pscustomobject]@{ Suppress = $false; Reason = "" }
    }

    if (-not ($Sessions -is [System.Collections.IDictionary])) {
        return [pscustomobject]@{ Suppress = $false; Reason = "" }
    }

    $now = Get-Date
    $recentDoneAge = $null
    $recentInputAge = $null

    foreach ($entry in $Sessions.GetEnumerator()) {
        $existing = $entry.Value
        if (-not (Test-SameNotificationTarget -CurrentRecord $CurrentRecord -ExistingRecord $existing)) {
            continue
        }

        $createdAt = Get-RecordCreatedAt -Record $existing
        if ($null -eq $createdAt) {
            continue
        }

        $ageSeconds = [int]([Math]::Max(0, (New-TimeSpan -Start $createdAt -End $now).TotalSeconds))
        if ($ageSeconds -gt $QuietSeconds) {
            continue
        }

        $existingType = [string](Get-RecordValue -Record $existing -Name "type")
        if ($existingType -eq "done") {
            if ($null -eq $recentDoneAge -or $ageSeconds -lt $recentDoneAge) {
                $recentDoneAge = $ageSeconds
            }
        } elseif ($existingType -eq "input") {
            if ($null -eq $recentInputAge -or $ageSeconds -lt $recentInputAge) {
                $recentInputAge = $ageSeconds
            }
        }
    }

    if ($null -ne $recentDoneAge) {
        return [pscustomobject]@{
            Suppress = $true
            Reason = "recent done notification for same window ageSeconds=$recentDoneAge"
        }
    }

    if ($null -ne $recentInputAge) {
        return [pscustomobject]@{
            Suppress = $true
            Reason = "duplicate input notification for same window ageSeconds=$recentInputAge"
        }
    }

    return [pscustomobject]@{ Suppress = $false; Reason = "" }
}

function Send-ClaudeToast {
    param(
        [Parameter(Mandatory = $true)][string]$Sid,
        [Parameter(Mandatory = $true)][string]$ToastTitle,
        [Parameter(Mandatory = $true)][string]$ToastMessage,
        [string]$WindowDisplayName = ""
    )

    Ensure-BurntToast

    $activationUri = "claude-focus://focus?sid=$Sid"
    $children = @(
        (New-BTText -Text $ToastTitle),
        (New-BTText -Text $ToastMessage)
    )
    if (-not [string]::IsNullOrWhiteSpace($WindowDisplayName)) {
        $children += (New-BTText -Text $WindowDisplayName)
    }

    $bindingParams = @{ Children = $children }
    if (Test-Path -LiteralPath $iconPath) {
        $bindingParams["AppLogoOverride"] = New-BTImage -Source $iconPath -AppLogoOverride
    }

    $binding = New-BTBinding @bindingParams
    $visual = New-BTVisual -BindingGeneric $binding
    $content = New-BTContent -Visual $visual -Launch "sid=$Sid" -Duration Short

    $focusScript = Join-Path $hookDir "focus-window.ps1"
    $logPath = Join-Path $hookDir "toast-agent.log"
    $sidLiteral = $Sid.Replace("'", "''")
    $focusScriptLiteral = $focusScript.Replace("'", "''")
    $logPathLiteral = $logPath.Replace("'", "''")
    $action = [scriptblock]::Create(@"
        try {
            `$global:ClaudeToastActivated = `$true
            `$line = "{0} pid={1} toast activated sid={2}" -f (Get-Date).ToString("o"), `$PID, '$sidLiteral'
            [System.IO.File]::AppendAllText('$logPathLiteral', `$line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
            Start-Process -FilePath "powershell.exe" -WindowStyle Hidden -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", '$focusScriptLiteral', "-sid", '$sidLiteral')
        } catch {
            try {
                `$line = "{0} pid={1} toast activation failed: {2}" -f (Get-Date).ToString("o"), `$PID, `$_.Exception.Message
                [System.IO.File]::AppendAllText('$logPathLiteral', `$line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
            } catch {}
        }
"@)

    $notificationId = "claude-code-latest"
    $expirationTime = (Get-Date).AddMinutes(10)
    try {
        if (Get-Command Remove-BTNotification -ErrorAction SilentlyContinue) {
            Remove-BTNotification -UniqueIdentifier $notificationId -ErrorAction SilentlyContinue
            $agentStatePath = Join-Path $hookDir "window-state.json"
            if (Test-Path -LiteralPath $agentStatePath) {
                try {
                    $agentState = Get-Content -LiteralPath $agentStatePath -Raw -Encoding UTF8 | ConvertFrom-Json
                    $agentSessions = $null
                    if ($agentState.PSObject.Properties.Name -contains "sessions") {
                        $agentSessions = $agentState.sessions
                    } elseif ($agentState.PSObject.Properties.Name -contains "records") {
                        $agentSessions = $agentState.records
                    }

                    if ($agentSessions) {
                        foreach ($sessionProperty in @($agentSessions.PSObject.Properties)) {
                            if ($sessionProperty.Name -and $sessionProperty.Name -ne $Sid) {
                                Remove-BTNotification -UniqueIdentifier $sessionProperty.Name -ErrorAction SilentlyContinue
                            }
                        }
                    }
                } catch {
                    Write-ToastAgentLog "stale notification cleanup skipped: $($_.Exception.Message)"
                }
            }
        }
    } catch {
        Write-ToastAgentLog "stale notification cleanup failed: $($_.Exception.Message)"
    }

    try {
        Submit-BTNotification -Content $content -UniqueIdentifier $notificationId -ActivatedAction $action -ExpirationTime $expirationTime
    } catch {
        Submit-BTNotification -Content $content -UniqueIdentifier $notificationId -ActivatedAction $action
    }
    Write-ToastAgentLog "toast sent sid=$Sid notificationId=$notificationId activation=$activationUri display=$WindowDisplayName"

    $deadline = (Get-Date).AddMinutes(10)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
        if ($global:ClaudeToastActivated) {
            break
        }
    }

    Write-Output "Toast sent: sid=$Sid; activation=$activationUri"
}

function Start-ClaudeToastAgent {
    param(
        [Parameter(Mandatory = $true)][string]$AgentSid,
        [Parameter(Mandatory = $true)][string]$AgentTitle,
        [Parameter(Mandatory = $true)][string]$AgentMessage,
        [string]$AgentWindowName = ""
    )

    $scriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", (Quote-ProcessArgument $scriptPath),
        "-ToastAgent",
        "-Sid", $AgentSid,
        "-AgentTitleB64", (ConvertTo-Base64Utf8 $AgentTitle),
        "-AgentMessageB64", (ConvertTo-Base64Utf8 $AgentMessage),
        "-AgentWindowB64", (ConvertTo-Base64Utf8 $AgentWindowName)
    )

    Start-Process -FilePath "powershell.exe" -ArgumentList ($arguments -join " ") -WindowStyle Hidden | Out-Null
    Write-Output "Toast agent started: sid=$AgentSid"
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



