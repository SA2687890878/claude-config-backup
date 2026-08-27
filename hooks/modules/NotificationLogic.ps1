<#
.SYNOPSIS
    Notification suppression logic.
.DESCRIPTION
    Contains functions for determining whether to suppress notifications
    based on recent notification history.
#>

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

# Functions are available when dot-sourced
