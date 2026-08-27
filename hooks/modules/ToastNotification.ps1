<#
.SYNOPSIS
    Toast notification functions.
.DESCRIPTION
    Contains functions for:
    - Ensuring BurntToast module is installed
    - Sending toast notifications
    - Starting toast agent processes
    - Logging toast activity
#>

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

function Write-ToastAgentLog {
    param([string]$Text)

    try {
        $hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
        $path = Join-Path $hookDir "toast-agent.log"
        $line = "{0} pid={1} {2}" -f (Get-Date).ToString("o"), $PID, $Text
        [System.IO.File]::AppendAllText($path, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
    } catch {
        # Logging must never block notifications.
    }
}

function Send-ClaudeToast {
    param(
        [Parameter(Mandatory = $true)][string]$Sid,
        [Parameter(Mandatory = $true)][string]$ToastTitle,
        [Parameter(Mandatory = $true)][string]$ToastMessage,
        [string]$WindowDisplayName = ""
    )

    $hookDir = Join-Path $env:USERPROFILE ".claude\hooks"
    $toastPngPath = Join-Path $hookDir "claude-toast.png"
    $toastIcoPath = Join-Path $hookDir "claude.ico"
    $iconPath = if (Test-Path -LiteralPath $toastPngPath) { $toastPngPath } else { $toastIcoPath }

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

# Functions are available when dot-sourced
