<#
.SYNOPSIS
    Window management functions for Claude Code notifications.
.DESCRIPTION
    Contains functions for working with Windows windows and processes:
    - Win32 API type definitions
    - Window title and PID retrieval
    - Process chain traversal
    - Window candidate selection
#>

# Win32 API type definitions
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

# Functions are available when dot-sourced
