<#
.SYNOPSIS
    JSON and state management utilities.
.DESCRIPTION
    Contains functions for:
    - Converting data to plain objects
    - Reading and writing JSON state files
    - Base64 encoding/decoding
    - XML escaping
#>

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

# Functions are available when dot-sourced
