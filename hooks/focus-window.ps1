[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$sid
)

$ErrorActionPreference = "Stop"

$hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
$statePath = Join-Path $hookDir "window-state.json"
$logPath = Join-Path $hookDir "focus-window.log"
$script:AllowedFocusProcessNames = @("powershell", "pwsh", "cmd", "wt", "WindowsTerminal", "WindowsTerminalPreview")

function Write-FocusLog {
    param([string]$Message)

    try {
        if (-not (Test-Path -LiteralPath $hookDir)) {
            New-Item -ItemType Directory -Path $hookDir -Force | Out-Null
        }
        $line = "{0} pid={1} {2}" -f (Get-Date).ToString("o"), $PID, $Message
        [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
    } catch {
        # Logging must never block window activation.
    }
}

function Add-ClaudeFocusNativeTypes {
    if ("ClaudeCodeFocusWin32" -as [type]) {
        return
    }

    Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class ClaudeCodeFocusWin32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();
}
"@
}

function Resolve-ClaudeSid {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Missing sid parameter."
    }

    $trimmed = $Value.Trim('"').Trim()
    if ($trimmed -match '^(?i)claude-focus://') {
        try {
            $uri = [Uri]$trimmed
            $query = $uri.Query.TrimStart("?")
            foreach ($pair in $query -split "&") {
                if ([string]::IsNullOrWhiteSpace($pair)) {
                    continue
                }
                $parts = $pair -split "=", 2
                $name = [Uri]::UnescapeDataString($parts[0])
                $val = if ($parts.Count -gt 1) { [Uri]::UnescapeDataString($parts[1]) } else { "" }
                if ($name -eq "sid") {
                    return $val
                }
            }
        } catch {
            throw "Failed to parse sid from URI: $Value"
        }
    }

    if ($trimmed -match '(?i)(?:\?|&|^)sid=([^&]+)') {
        return [Uri]::UnescapeDataString($matches[1])
    }

    return $trimmed
}

function Get-JsonPropertyValue {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name
    )

    if ($null -eq $Object) {
        return $null
    }

    $prop = $Object.PSObject.Properties[$Name]
    if ($prop) {
        return $prop.Value
    }

    return $null
}

function Get-WindowTitle {
    param([IntPtr]$Hwnd)

    if ($Hwnd -eq [IntPtr]::Zero -or -not [ClaudeCodeFocusWin32]::IsWindow($Hwnd)) {
        return ""
    }

    $buffer = New-Object System.Text.StringBuilder 1024
    [void][ClaudeCodeFocusWin32]::GetWindowText($Hwnd, $buffer, $buffer.Capacity)
    return $buffer.ToString()
}

function Get-WindowPid {
    param([IntPtr]$Hwnd)

    if ($Hwnd -eq [IntPtr]::Zero -or -not [ClaudeCodeFocusWin32]::IsWindow($Hwnd)) {
        return 0
    }

    [uint32]$pidValue = 0
    [void][ClaudeCodeFocusWin32]::GetWindowThreadProcessId($Hwnd, [ref]$pidValue)
    return [int]$pidValue
}

function Get-ProcessNameById {
    param([int]$ProcessId)

    if ($ProcessId -le 0) {
        return ""
    }

    try {
        return [string](Get-Process -Id $ProcessId -ErrorAction Stop).ProcessName
    } catch {
        return ""
    }
}

function Test-AllowedFocusHwnd {
    param(
        [IntPtr]$Hwnd,
        [string]$Reason
    )

    $targetPid = Get-WindowPid -Hwnd $Hwnd
    $processName = Get-ProcessNameById -ProcessId $targetPid
    if ($script:AllowedFocusProcessNames -contains $processName) {
        return $true
    }

    Write-FocusLog ("skip {0}: non-terminal process pid={1} name=""{2}"" title=""{3}""" -f $Reason, $targetPid, $processName, (Get-WindowTitle -Hwnd $Hwnd))
    return $false
}

function Get-VisibleWindows {
    $script:visibleWindowResults = @()

    $callback = [ClaudeCodeFocusWin32+EnumWindowsProc]{
        param([IntPtr]$hwnd, [IntPtr]$lParam)

        if ([ClaudeCodeFocusWin32]::IsWindowVisible($hwnd)) {
            $title = Get-WindowTitle -Hwnd $hwnd
            if (-not [string]::IsNullOrWhiteSpace($title)) {
                $pidValue = Get-WindowPid -Hwnd $hwnd
                $processName = ""
                try {
                    $processName = (Get-Process -Id $pidValue -ErrorAction Stop).ProcessName
                } catch {
                    $processName = ""
                }

                $script:visibleWindowResults += [pscustomobject]@{
                    hwnd        = [int64]$hwnd
                    pid         = [int]$pidValue
                    processName = [string]$processName
                    title       = [string]$title
                }
            }
        }

        return $true
    }

    [void][ClaudeCodeFocusWin32]::EnumWindows($callback, [IntPtr]::Zero)
    return @($script:visibleWindowResults)
}

function Test-TitleMatch {
    param(
        [string]$CandidateTitle,
        [string[]]$TargetTitles
    )

    if ([string]::IsNullOrWhiteSpace($CandidateTitle)) {
        return $false
    }

    $candidate = $CandidateTitle.Trim().ToLowerInvariant()
    foreach ($title in $TargetTitles) {
        if ([string]::IsNullOrWhiteSpace($title)) {
            continue
        }

        $target = $title.Trim().ToLowerInvariant()
        if ($candidate -eq $target -or $candidate.Contains($target) -or $target.Contains($candidate)) {
            return $true
        }
    }

    return $false
}

function Invoke-FocusHwnd {
    param(
        [IntPtr]$Hwnd,
        [string]$Reason
    )

    if ($Hwnd -eq [IntPtr]::Zero) {
        Write-Verbose "$Reason skipped: hwnd is zero."
        return $false
    }

    if (-not [ClaudeCodeFocusWin32]::IsWindow($Hwnd)) {
        Write-Verbose "$Reason skipped: hwnd no longer exists: $([int64]$Hwnd)"
        return $false
    }

    if (-not (Test-AllowedFocusHwnd -Hwnd $Hwnd -Reason $Reason)) {
        return $false
    }

    if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
        Write-Output ("Focused window by {0}: hwnd=0x{1:X}; title=""{2}""" -f $Reason, $Hwnd.ToInt64(), (Get-WindowTitle -Hwnd $Hwnd))
        return $true
    }

    if ([ClaudeCodeFocusWin32]::IsIconic($Hwnd)) {
        [void][ClaudeCodeFocusWin32]::ShowWindowAsync($Hwnd, 9)
        Start-Sleep -Milliseconds 120
    } else {
        [void][ClaudeCodeFocusWin32]::ShowWindowAsync($Hwnd, 5)
    }

    $ok = [ClaudeCodeFocusWin32]::SetForegroundWindow($Hwnd)
    Start-Sleep -Milliseconds 80
    if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
        $ok = $true
    }

    if (-not $ok) {
        $foreground = [ClaudeCodeFocusWin32]::GetForegroundWindow()
        [uint32]$foregroundPid = 0
        [uint32]$targetPid = 0
        $foregroundThread = [ClaudeCodeFocusWin32]::GetWindowThreadProcessId($foreground, [ref]$foregroundPid)
        $targetThread = [ClaudeCodeFocusWin32]::GetWindowThreadProcessId($Hwnd, [ref]$targetPid)
        $currentThread = [ClaudeCodeFocusWin32]::GetCurrentThreadId()

        try {
            if ($targetThread -ne 0) {
                [void][ClaudeCodeFocusWin32]::AttachThreadInput($currentThread, $targetThread, $true)
            }
            if ($foregroundThread -ne 0) {
                [void][ClaudeCodeFocusWin32]::AttachThreadInput($currentThread, $foregroundThread, $true)
            }

            [void][ClaudeCodeFocusWin32]::ShowWindowAsync($Hwnd, 5)
            [void][ClaudeCodeFocusWin32]::BringWindowToTop($Hwnd)
            $ok = [ClaudeCodeFocusWin32]::SetForegroundWindow($Hwnd)
            Start-Sleep -Milliseconds 80
            if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
                $ok = $true
            }
        } finally {
            if ($foregroundThread -ne 0) {
                [void][ClaudeCodeFocusWin32]::AttachThreadInput($currentThread, $foregroundThread, $false)
            }
            if ($targetThread -ne 0) {
                [void][ClaudeCodeFocusWin32]::AttachThreadInput($currentThread, $targetThread, $false)
            }
        }
    }

    if (-not $ok) {
        try {
            $shell = New-Object -ComObject WScript.Shell
            $shell.SendKeys("%")
            Start-Sleep -Milliseconds 80
            [void][ClaudeCodeFocusWin32]::ShowWindowAsync($Hwnd, 5)
            [void][ClaudeCodeFocusWin32]::BringWindowToTop($Hwnd)
            $ok = [ClaudeCodeFocusWin32]::SetForegroundWindow($Hwnd)
            Start-Sleep -Milliseconds 100
            if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
                $ok = $true
            }
        } catch {
            Write-Verbose "Alt-key foreground unlock failed: $($_.Exception.Message)"
        }
    }

    if (-not $ok) {
        try {
            [ClaudeCodeFocusWin32]::SwitchToThisWindow($Hwnd, $true)
            Start-Sleep -Milliseconds 100
            if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
                $ok = $true
            }
        } catch {
            Write-Verbose "SwitchToThisWindow fallback failed: $($_.Exception.Message)"
        }
    }

    if (-not $ok) {
        try {
            $hwndTopMost = [IntPtr](-1)
            $hwndNotTopMost = [IntPtr](-2)
            $flags = [uint32](0x0001 -bor 0x0002 -bor 0x0040)
            [void][ClaudeCodeFocusWin32]::SetWindowPos($Hwnd, $hwndTopMost, 0, 0, 0, 0, $flags)
            [void][ClaudeCodeFocusWin32]::SetWindowPos($Hwnd, $hwndNotTopMost, 0, 0, 0, 0, $flags)
            [void][ClaudeCodeFocusWin32]::BringWindowToTop($Hwnd)
            $ok = [ClaudeCodeFocusWin32]::SetForegroundWindow($Hwnd)
            Start-Sleep -Milliseconds 100
            if ([ClaudeCodeFocusWin32]::GetForegroundWindow() -eq $Hwnd) {
                $ok = $true
            }
        } catch {
            Write-Verbose "SetWindowPos fallback failed: $($_.Exception.Message)"
        }
    }

    if ($ok) {
        Write-FocusLog ("success reason={0} hwnd=0x{1:X} title=""{2}""" -f $Reason, $Hwnd.ToInt64(), (Get-WindowTitle -Hwnd $Hwnd))
        Write-Output ("Focused window by {0}: hwnd=0x{1:X}; title=""{2}""" -f $Reason, $Hwnd.ToInt64(), (Get-WindowTitle -Hwnd $Hwnd))
        return $true
    }

    try {
        $targetPidForAppActivate = Get-WindowPid -Hwnd $Hwnd
        if ($targetPidForAppActivate -gt 0) {
            $shell = New-Object -ComObject WScript.Shell
            if ($shell.AppActivate($targetPidForAppActivate)) {
                Write-FocusLog ("success reason=WScript.AppActivate pid after {0} pid={1} title=""{2}""" -f $Reason, $targetPidForAppActivate, (Get-WindowTitle -Hwnd $Hwnd))
                Write-Output ("Focused window by WScript.AppActivate after {0}: pid={1}; title=""{2}""" -f $Reason, $targetPidForAppActivate, (Get-WindowTitle -Hwnd $Hwnd))
                return $true
            }
        }

        $targetTitleForAppActivate = Get-WindowTitle -Hwnd $Hwnd
        if (-not [string]::IsNullOrWhiteSpace($targetTitleForAppActivate)) {
            $shell = New-Object -ComObject WScript.Shell
            if ($shell.AppActivate($targetTitleForAppActivate)) {
                Write-FocusLog ("success reason=WScript.AppActivate title after {0} title=""{1}""" -f $Reason, $targetTitleForAppActivate)
                Write-Output ("Focused window by WScript.AppActivate title after {0}: title=""{1}""" -f $Reason, $targetTitleForAppActivate)
                return $true
            }
        }
    } catch {
        Write-Verbose "WScript.AppActivate fallback failed: $($_.Exception.Message)"
    }

    Write-Verbose "$Reason failed: SetForegroundWindow returned false for hwnd=0x$('{0:X}' -f $Hwnd.ToInt64())."
    return $false
}

function Add-UniqueNumber {
    param(
        [System.Collections.Generic.List[Int64]]$List,
        $Value
    )

    if ($null -eq $Value) {
        return
    }

    try {
        $number = [int64]$Value
        if ($number -ne 0 -and -not $List.Contains($number)) {
            $List.Add($number)
        }
    } catch {
        return
    }
}

Add-ClaudeFocusNativeTypes
Write-FocusLog "start sidArg=$sid"
$resolvedSid = Resolve-ClaudeSid -Value $sid
Write-FocusLog "resolvedSid=$resolvedSid"

if (-not (Test-Path -LiteralPath $statePath)) {
    throw "State file not found: $statePath"
}

try {
    $stateRaw = [System.IO.File]::ReadAllText($statePath, [System.Text.Encoding]::UTF8)
    $state = $stateRaw | ConvertFrom-Json -ErrorAction Stop
} catch {
    throw "window-state.json parse failed; cannot locate window: $($_.Exception.Message)"
}

$sessions = Get-JsonPropertyValue -Object $state -Name "sessions"
if (-not $sessions) {
    throw "window-state.json does not contain a sessions field."
}

$recordProperty = $sessions.PSObject.Properties[$resolvedSid]
if (-not $recordProperty) {
    throw "No window record found for sid: $resolvedSid"
}

$record = $recordProperty.Value
Write-FocusLog ("record type={0} windowTitle=""{1}"" display=""{2}""" -f (Get-JsonPropertyValue -Object $record -Name "type"), (Get-JsonPropertyValue -Object $record -Name "windowTitle"), (Get-JsonPropertyValue -Object $record -Name "windowDisplayName"))
$targetTitles = New-Object System.Collections.Generic.List[string]
foreach ($name in @("windowTitle")) {
    $value = [string](Get-JsonPropertyValue -Object $record -Name $name)
    if (-not [string]::IsNullOrWhiteSpace($value) -and -not $targetTitles.Contains($value)) {
        $targetTitles.Add($value)
    }
}

$processChain = Get-JsonPropertyValue -Object $record -Name "processChain"
if ($processChain) {
    foreach ($item in @($processChain)) {
        $processName = [string](Get-JsonPropertyValue -Object $item -Name "processName")
        if ($script:AllowedFocusProcessNames -notcontains $processName) {
            continue
        }

        $title = [string](Get-JsonPropertyValue -Object $item -Name "mainWindowTitle")
        if (-not [string]::IsNullOrWhiteSpace($title) -and -not $targetTitles.Contains($title)) {
            $targetTitles.Add($title)
        }
    }
}

$hwndValue = Get-JsonPropertyValue -Object $record -Name "hwnd"
if ($hwndValue) {
    $hwnd = [IntPtr]([int64]$hwndValue)
    if (Invoke-FocusHwnd -Hwnd $hwnd -Reason "stored hwnd") {
        exit 0
    }
}

$pidCandidates = New-Object System.Collections.Generic.List[Int64]
foreach ($name in @("hwndPid", "pid", "parentPid")) {
    Add-UniqueNumber -List $pidCandidates -Value (Get-JsonPropertyValue -Object $record -Name $name)
}
if ($processChain) {
    foreach ($item in @($processChain)) {
        Add-UniqueNumber -List $pidCandidates -Value (Get-JsonPropertyValue -Object $item -Name "pid")
    }
}

foreach ($pidCandidate in $pidCandidates) {
    try {
        $proc = Get-Process -Id ([int]$pidCandidate) -ErrorAction Stop
        if ($proc.MainWindowHandle -and [int64]$proc.MainWindowHandle -ne 0) {
            if (Invoke-FocusHwnd -Hwnd ([IntPtr]([int64]$proc.MainWindowHandle)) -Reason "pid $pidCandidate MainWindowHandle") {
                exit 0
            }
        }
    } catch {
        Write-Verbose "PID candidate unavailable: $pidCandidate"
    }
}

$visibleWindows = Get-VisibleWindows
foreach ($window in $visibleWindows) {
    if (Test-TitleMatch -CandidateTitle $window.title -TargetTitles @($targetTitles)) {
        if (Invoke-FocusHwnd -Hwnd ([IntPtr]([int64]$window.hwnd)) -Reason "title fuzzy match") {
            exit 0
        }
    }
}

$terminalProcessNames = @("WindowsTerminal", "WindowsTerminalPreview", "wt")
$terminalWindows = @($visibleWindows | Where-Object { $terminalProcessNames -contains $_.processName })
foreach ($window in $terminalWindows) {
    if (Test-TitleMatch -CandidateTitle $window.title -TargetTitles @($targetTitles)) {
        if (Invoke-FocusHwnd -Hwnd ([IntPtr]([int64]$window.hwnd)) -Reason "Windows Terminal title match") {
            exit 0
        }
    }
}

if ($terminalWindows.Count -eq 1) {
    if (Invoke-FocusHwnd -Hwnd ([IntPtr]([int64]$terminalWindows[0].hwnd)) -Reason "single Windows Terminal fallback") {
        exit 0
    }
}

$titleSummary = if ($targetTitles.Count -gt 0) { $targetTitles -join " | " } else { "<empty>" }
$pidSummary = if ($pidCandidates.Count -gt 0) { $pidCandidates -join ", " } else { "<empty>" }
Write-FocusLog "failed sid=$resolvedSid hwnd=$hwndValue pidCandidates=$pidSummary titleCandidates=$titleSummary"
throw "Failed to activate a window: sid=$resolvedSid; hwnd=$hwndValue; pidCandidates=$pidSummary; titleCandidates=$titleSummary"

