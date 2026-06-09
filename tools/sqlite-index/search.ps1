<#
.SYNOPSIS
    索引查询器 (SQLite 版) - 根据关键词搜索 C# 代码索引中的类、接口、属性、方法。

.DESCRIPTION
    查询 build-index-sqlite.ps1 生成的 SQLite 索引数据库，支持关键词和正则表达式搜索。
    使用索引加速查询，支持分页，不一次性加载全部数据。

.PARAMETER Query
    搜索关键词，支持正则表达式（如 "Auth.*Controller"）。

.PARAMETER DbPath
    SQLite 数据库路径，默认 C:\Users\admin\.claude\cache\index.db。

.PARAMETER MaxResults
    每类符号的最大结果数，默认 20。

.PARAMETER Type
    限定搜索的符号类型，可选值：class, interface, property, method, all（默认 all）。

.PARAMETER Page
    页码，默认 1。

.PARAMETER PageSize
    每页结果数，默认 20。

.PARAMETER Fts
    启用 FTS5 全文搜索模式（更快但需要 FTS 表已初始化）。

.PARAMETER Callers
    查找调用了指定方法的所有方法。

.PARAMETER Callees
    查找指定方法调用的所有方法。

.PARAMETER Stats
    显示索引统计信息。

.PARAMETER Namespace
    按命名空间过滤。

.PARAMETER InitFts
    初始化 FTS5 全文搜索表。

.EXAMPLE
    .\search-index-sqlite.ps1 -Query "ClientStore"
    .\search-index-sqlite.ps1 -Query "^Auth" -Type class
    .\search-index-sqlite.ps1 -Query "\basync\b" -Type method -MaxResults 10
    .\search-index-sqlite.ps1 -Callers "ClientStore.GetData"
    .\search-index-sqlite.ps1 -Stats
    .\search-index-sqlite.ps1 -InitFts
#>

param(
    [Parameter(Position = 0)]
    [string]$Query,

    [string]$ProjectPath,

    [string]$DbPath,

    [int]$MaxResults = 20,

    [ValidateSet("all", "class", "interface", "property", "method")]
    [string]$Type = "all",

    [int]$Page = 1,

    [int]$PageSize = 20,

    [switch]$Fts,

    [string]$Callers,

    [string]$Callees,

    [switch]$Stats,

    [switch]$IndexStats,

    [string]$Namespace,

    [switch]$InitFts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── 加载公共模块 ─────────────────────────────────────────
. $PSScriptRoot\common.ps1

# ─── 加载配置 ─────────────────────────────────────────────
$config = Load-Config
$useWal = [bool]$config.sqlite.useWal

# ─── 确定数据库路径 ───────────────────────────────────────
if ($DbPath) {
    # 显式指定数据库路径
    $config | Add-Member -NotePropertyName "dbPath" -NotePropertyValue $DbPath -Force
} elseif ($ProjectPath) {
    # 根据项目路径生成独立数据库
    $absProjectPath = (Resolve-Path $ProjectPath).Path
    $dbPath = Get-ProjectDbPath -ProjectPath $absProjectPath -DbDir $config.dbDir
    $config | Add-Member -NotePropertyName "dbPath" -NotePropertyValue $dbPath -Force
} else {
    # 默认使用当前目录
    $currentDir = (Get-Location).Path
    $dbPath = Get-ProjectDbPath -ProjectPath $currentDir -DbDir $config.dbDir
    $config | Add-Member -NotePropertyName "dbPath" -NotePropertyValue $dbPath -Force
}

# ─── 检查数据库文件 ───────────────────────────────────────
if (-not (Test-Path $config.dbPath)) {
    Write-Error "数据库文件不存在: $($config.dbPath)"
    Write-Host "请先运行 build-index-sqlite.ps1 构建索引" "Yellow"
    exit 1
}

# ─── 初始化 FTS ────────────────────────────────────────────
if ($InitFts) {
    $conn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    Initialize-Database -Conn $conn
    $ftsOk = Initialize-FTS5 -Conn $conn
    if ($ftsOk) {
        Write-Status "FTS5 全文搜索表已初始化" "Green"
    } else {
        Write-Status "FTS5 初始化失败" "Red"
    }
    $conn.Close()
    $conn.Dispose()
    exit 0
}

# ─── 统计模式 ──────────────────────────────────────────────
if ($Stats) {
    $conn = Get-SqliteConnection -DbPath $config.dbPath -ReadOnly $true -UseWal $useWal
    $indexStats = Get-IndexStats -Conn $conn

    Write-Header "索引统计"
    Write-Status "文件总数:     $($indexStats.totalFiles)" "Cyan"
    Write-Status "类:           $($indexStats.totalClasses)" "Cyan"
    Write-Status "接口:         $($indexStats.totalInterfaces)" "Cyan"
    Write-Status "方法:         $($indexStats.totalMethods)" "Cyan"
    Write-Status "属性:         $($indexStats.totalProperties)" "Cyan"
    Write-Status "调用边:       $($indexStats.totalCallEdges)" "Cyan"
    Write-Status "命名空间:     $($indexStats.totalNamespaces)" "Cyan"

    # 命名空间分布
    Write-Host ""
    Write-Status "命名空间分布 (Top 10):" "Yellow"
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM v_namespace_stats LIMIT 10"
    $reader = $cmd.ExecuteReader()
    while ($reader.Read()) {
        $ns = $reader.GetString(0)
        $count = $reader.GetInt64(1)
        Write-Status "  $ns`: $count" "White"
    }
    $reader.Dispose()
    $cmd.Dispose()

    Write-Footer

    # 记录统计查询
    $statsConn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    Update-QueryStats -Conn $statsConn -QueryType "stats" -ResultCount 1
    $statsConn.Close()
    $statsConn.Dispose()

    $conn.Close()
    $conn.Dispose()
    exit 0
}

# ─── Token 统计模式 ────────────────────────────────────────
if ($IndexStats) {
    $conn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    $queryStats = Get-QueryStats -Conn $conn
    Show-QueryStats -Stats $queryStats
    $conn.Close()
    $conn.Dispose()
    exit 0
}

# ─── 查找调用者 ────────────────────────────────────────────
if ($Callers) {
    $conn = Get-SqliteConnection -DbPath $config.dbPath -ReadOnly $true -UseWal $useWal

    Write-Header "调用者查询: $Callers"

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT DISTINCT
    caller_name,
    caller_class,
    return_type,
    parameters,
    file_path,
    line
FROM v_callers
WHERE callee_name LIKE @pattern
ORDER BY caller_name
LIMIT @limit
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $cmd.Parameters["@pattern"].Value = "%$Callers%"
    $cmd.Parameters["@limit"].Value = $MaxResults

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            callerName = $reader.GetString(0)
            className  = if ($reader.IsDBNull(1)) { "" } else { $reader.GetString(1) }
            returnType = if ($reader.IsDBNull(2)) { "" } else { $reader.GetString(2) }
            parameters = if ($reader.IsDBNull(3)) { "" } else { $reader.GetString(3) }
            filePath   = $reader.GetString(4)
            line       = $reader.GetInt32(5)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    if ($results.Count -eq 0) {
        Write-Status "未找到调用 $Callers 的方法" "Yellow"
    } else {
        Write-Status "找到 $($results.Count) 个调用者:" "Green"
        Write-Host ""
        foreach ($r in $results) {
            $shortFile = Shorten-Path $r.filePath
            $classInfo = if ($r.className) { " ($($r.className))" } else { "" }
            Write-Status "  $($r.returnType) $($r.callerName)($($r.parameters))$classInfo" "White"
            Write-Status "    file: $shortFile`:$($r.line)" "DarkYellow"
        }
    }

    Write-Footer

    # 记录统计
    $statsConn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    Update-QueryStats -Conn $statsConn -QueryType "caller" -ResultCount $results.Count
    $statsConn.Close()
    $statsConn.Dispose()

    $conn.Close()
    $conn.Dispose()
    exit 0
}

# ─── 查找被调用者 ──────────────────────────────────────────
if ($Callees) {
    $conn = Get-SqliteConnection -DbPath $config.dbPath -ReadOnly $true -UseWal $useWal

    Write-Header "被调用者查询: $Callees"

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT DISTINCT
    callee_name,
    f.path as file_path,
    cg.line
FROM call_graph cg
JOIN files f ON cg.file_id = f.id
WHERE caller_name LIKE @pattern
ORDER BY callee_name
LIMIT @limit
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $cmd.Parameters["@pattern"].Value = "%$Callees%"
    $cmd.Parameters["@limit"].Value = $MaxResults

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            calleeName = $reader.GetString(0)
            filePath   = $reader.GetString(1)
            line       = $reader.GetInt32(2)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    if ($results.Count -eq 0) {
        Write-Status "未找到 $Callees 调用的方法" "Yellow"
    } else {
        Write-Status "找到 $($results.Count) 个被调用者:" "Green"
        Write-Host ""
        foreach ($r in $results) {
            $shortFile = Shorten-Path $r.filePath
            Write-Status "  $($r.calleeName)" "White"
            Write-Status "    file: $shortFile`:$($r.line)" "DarkYellow"
        }
    }

    Write-Footer

    # 记录统计
    $statsConn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    Update-QueryStats -Conn $statsConn -QueryType "callee" -ResultCount $results.Count
    $statsConn.Close()
    $statsConn.Dispose()

    $conn.Close()
    $conn.Dispose()
    exit 0
}

# ─── 验证正则表达式 ────────────────────────────────────────
if ($Query) {
    try {
        $null = [regex]::IsMatch("test", $Query)
    } catch {
        Write-Error "无效的正则表达式: $Query"
        exit 1
    }
}

# ─── 连接数据库 ────────────────────────────────────────────
$useWal = [bool]$config.sqlite.useWal
$conn = Get-SqliteConnection -DbPath $config.dbPath -ReadOnly $true -UseWal $useWal

# ─── FTS 搜索函数 ──────────────────────────────────────────
function Search-FTS {
    param([string]$Pattern, [int]$Limit)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT name, namespace, kind, file_path
FROM symbols_fts
WHERE symbols_fts MATCH @pattern
ORDER BY rank
LIMIT @limit
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $cmd.Parameters["@pattern"].Value = $Pattern
    $cmd.Parameters["@limit"].Value = $Limit

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            name      = $reader.GetString(0)
            namespace = if ($reader.IsDBNull(1)) { "" } else { $reader.GetString(1) }
            kind      = $reader.GetString(2)
            filePath  = $reader.GetString(3)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    return ,$results
}

# ─── 普通搜索函数 ──────────────────────────────────────────
function Search-Classes {
    param([string]$Pattern, [int]$Limit, [int]$Offset)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT c.id, c.name, c.namespace, c.line, c.base_types, c.is_static, c.is_abstract, f.path
FROM classes c
JOIN files f ON c.file_id = f.id
WHERE (c.name LIKE @pattern OR c.namespace LIKE @pattern)
$(if ($Namespace) { "AND c.namespace LIKE @namespace" })
ORDER BY c.name
LIMIT @limit OFFSET @offset
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $null = $cmd.Parameters.Add("@offset", [System.Data.DbType]::Int32)

    $likePattern = $Pattern -replace '^\^', '' -replace '\$$', '' -replace '\.\*', '%'
    $cmd.Parameters["@pattern"].Value = "%$likePattern%"
    $cmd.Parameters["@limit"].Value = $Limit
    $cmd.Parameters["@offset"].Value = $Offset

    if ($Namespace) {
        $null = $cmd.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $cmd.Parameters["@namespace"].Value = "%$Namespace%"
    }

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            id        = $reader.GetInt64(0)
            name      = $reader.GetString(1)
            namespace = $reader.GetString(2)
            line      = $reader.GetInt32(3)
            baseTypes = if ($reader.IsDBNull(4)) { @() } else { $reader.GetString(4) -split ";" }
            isStatic  = $reader.GetInt32(5) -eq 1
            isAbstract = $reader.GetInt32(6) -eq 1
            file      = $reader.GetString(7)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    $filtered = [System.Collections.ArrayList]@()
    foreach ($item in $results) {
        if (([regex]::IsMatch($item.name, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.namespace, $Pattern, 'IgnoreCase'))) {
            $null = $filtered.Add($item)
        }
    }

    return ,$filtered
}

function Search-Interfaces {
    param([string]$Pattern, [int]$Limit, [int]$Offset)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT i.id, i.name, i.namespace, i.line, i.base_types, f.path
FROM interfaces i
JOIN files f ON i.file_id = f.id
WHERE (i.name LIKE @pattern OR i.namespace LIKE @pattern)
$(if ($Namespace) { "AND i.namespace LIKE @namespace" })
ORDER BY i.name
LIMIT @limit OFFSET @offset
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $null = $cmd.Parameters.Add("@offset", [System.Data.DbType]::Int32)

    $likePattern = $Pattern -replace '^\^', '' -replace '\$$', '' -replace '\.\*', '%'
    $cmd.Parameters["@pattern"].Value = "%$likePattern%"
    $cmd.Parameters["@limit"].Value = $Limit
    $cmd.Parameters["@offset"].Value = $Offset

    if ($Namespace) {
        $null = $cmd.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $cmd.Parameters["@namespace"].Value = "%$Namespace%"
    }

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            id        = $reader.GetInt64(0)
            name      = $reader.GetString(1)
            namespace = $reader.GetString(2)
            line      = $reader.GetInt32(3)
            baseTypes = if ($reader.IsDBNull(4)) { @() } else { $reader.GetString(4) -split ";" }
            file      = $reader.GetString(5)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    $filtered = [System.Collections.ArrayList]@()
    foreach ($item in $results) {
        if (([regex]::IsMatch($item.name, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.namespace, $Pattern, 'IgnoreCase'))) {
            $null = $filtered.Add($item)
        }
    }

    return ,$filtered
}

function Search-Methods {
    param([string]$Pattern, [int]$Limit, [int]$Offset)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT m.id, m.name, m.return_type, m.line, m.modifiers, m.parameters,
       m.is_public, m.is_static, m.is_async, m.is_virtual, m.is_override,
       c.name as class_name, f.path
FROM methods m
LEFT JOIN classes c ON m.class_id = c.id
JOIN files f ON m.file_id = f.id
WHERE (m.name LIKE @pattern OR m.return_type LIKE @pattern OR c.name LIKE @pattern)
$(if ($Namespace) { "AND c.namespace LIKE @namespace" })
ORDER BY m.name
LIMIT @limit OFFSET @offset
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $null = $cmd.Parameters.Add("@offset", [System.Data.DbType]::Int32)

    $likePattern = $Pattern -replace '^\^', '' -replace '\$$', '' -replace '\.\*', '%'
    $cmd.Parameters["@pattern"].Value = "%$likePattern%"
    $cmd.Parameters["@limit"].Value = $Limit
    $cmd.Parameters["@offset"].Value = $Offset

    if ($Namespace) {
        $null = $cmd.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $cmd.Parameters["@namespace"].Value = "%$Namespace%"
    }

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            id         = $reader.GetInt64(0)
            name       = $reader.GetString(1)
            returnType = $reader.GetString(2)
            line       = $reader.GetInt32(3)
            modifiers  = $reader.GetString(4)
            parameters = $reader.GetString(5)
            isPublic   = $reader.GetInt32(6) -eq 1
            isStatic   = $reader.GetInt32(7) -eq 1
            isAsync    = $reader.GetInt32(8) -eq 1
            isVirtual  = $reader.GetInt32(9) -eq 1
            isOverride = $reader.GetInt32(10) -eq 1
            className  = if ($reader.IsDBNull(11)) { "" } else { $reader.GetString(11) }
            file       = $reader.GetString(12)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    $filtered = [System.Collections.ArrayList]@()
    foreach ($item in $results) {
        if (([regex]::IsMatch($item.name, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.returnType, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.className, $Pattern, 'IgnoreCase'))) {
            $null = $filtered.Add($item)
        }
    }

    return ,$filtered
}

function Search-Properties {
    param([string]$Pattern, [int]$Limit, [int]$Offset)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT p.id, p.name, p.type, p.line, p.has_get, p.has_set, p.is_public, p.is_static,
       c.name as class_name, f.path
FROM properties p
LEFT JOIN classes c ON p.class_id = c.id
JOIN files f ON p.file_id = f.id
WHERE (p.name LIKE @pattern OR p.type LIKE @pattern OR c.name LIKE @pattern)
$(if ($Namespace) { "AND c.namespace LIKE @namespace" })
ORDER BY p.name
LIMIT @limit OFFSET @offset
"@
    $null = $cmd.Parameters.Add("@pattern", [System.Data.DbType]::String)
    $null = $cmd.Parameters.Add("@limit", [System.Data.DbType]::Int32)
    $null = $cmd.Parameters.Add("@offset", [System.Data.DbType]::Int32)

    $likePattern = $Pattern -replace '^\^', '' -replace '\$$', '' -replace '\.\*', '%'
    $cmd.Parameters["@pattern"].Value = "%$likePattern%"
    $cmd.Parameters["@limit"].Value = $Limit
    $cmd.Parameters["@offset"].Value = $Offset

    if ($Namespace) {
        $null = $cmd.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $cmd.Parameters["@namespace"].Value = "%$Namespace%"
    }

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            id        = $reader.GetInt64(0)
            name      = $reader.GetString(1)
            type      = $reader.GetString(2)
            line      = $reader.GetInt32(3)
            hasGet    = $reader.GetInt32(4) -eq 1
            hasSet    = $reader.GetInt32(5) -eq 1
            isPublic  = $reader.GetInt32(6) -eq 1
            isStatic  = $reader.GetInt32(7) -eq 1
            className = if ($reader.IsDBNull(8)) { "" } else { $reader.GetString(8) }
            file      = $reader.GetString(9)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    $filtered = [System.Collections.ArrayList]@()
    foreach ($item in $results) {
        if (([regex]::IsMatch($item.name, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.type, $Pattern, 'IgnoreCase')) -or
            ([regex]::IsMatch($item.className, $Pattern, 'IgnoreCase'))) {
            $null = $filtered.Add($item)
        }
    }

    return ,$filtered
}

function Get-CallGraph {
    param([long]$MethodId)

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = @"
SELECT callee_name, line
FROM call_graph
WHERE caller_id = @caller_id
ORDER BY line
"@
    $null = $cmd.Parameters.Add("@caller_id", [System.Data.DbType]::Int64)
    $cmd.Parameters["@caller_id"].Value = $MethodId

    $reader = $cmd.ExecuteReader()
    $results = [System.Collections.ArrayList]@()
    while ($reader.Read()) {
        $null = $results.Add([PSCustomObject]@{
            callee = $reader.GetString(0)
            line   = $reader.GetInt32(1)
        })
    }
    $reader.Dispose()
    $cmd.Dispose()

    return ,$results
}

# ─── 显示函数 ──────────────────────────────────────────────
function Show-Classes {
    param($Items, [string]$Kind)

    if ($Items.Count -eq 0) { return }

    Write-Host ""
    $label = if ($Kind -eq "Class") { "Classes" } else { "${Kind}s" }
    Write-Status "=== $label ($($Items.Count) matches) ===" "Cyan"
    Write-Host ("-" * 80)

    foreach ($m in $Items) {
        $shortFile = Shorten-Path $m.file
        $baseInfo = ""
        $baseTypesArr = @($m.baseTypes)
        if ($baseTypesArr -and $baseTypesArr.Count -gt 0 -and $baseTypesArr[0]) {
            $baseInfo = " : $($baseTypesArr -join ', ')"
        }
        $flags = @()
        if ($m.PSObject.Properties['isStatic'] -and $m.isStatic) { $flags += "static" }
        if ($m.PSObject.Properties['isAbstract'] -and $m.isAbstract) { $flags += "abstract" }
        $flagStr = ""
        if ($flags.Count -gt 0) { $flagStr = " [$($flags -join ', ')]" }

        Write-Status "  $($m.name)$baseInfo$flagStr" "White"
        Write-Status "    namespace: $($m.namespace)" "Gray"
        Write-Status "    file:      $shortFile`:$($m.line)" "DarkYellow"
    }
}

function Show-Methods {
    param($Items)

    if ($Items.Count -eq 0) { return }

    Write-Host ""
    Write-Status "=== Methods ($($Items.Count) matches) ===" "Cyan"
    Write-Host ("-" * 80)

    foreach ($m in $Items) {
        $shortFile = Shorten-Path $m.file

        $mods = $m.modifiers -split ","
        $modStr = "[$($mods -join ', ')]"

        Write-Status "  $modStr $($m.returnType) $($m.name)($($m.parameters))" "White"
        if ($m.className) {
            Write-Status "    class: $($m.className)" "Gray"
        }
        Write-Status "    file:  $shortFile`:$($m.line)" "DarkYellow"

        $callees = Get-CallGraph -MethodId $m.id
        if ($callees.Count -gt 0) {
            $calleeDisplay = ($callees | ForEach-Object {
                $parts = $_.callee -split '\.'
                if ($parts.Count -ge 2) {
                    "$($parts[-2]).$($parts[-1])"
                } else {
                    $_.callee
                }
            } | Select-Object -Unique) -join ", "
            Write-Status "    calls: $calleeDisplay" "DarkGray"
        }
    }
}

function Show-Properties {
    param($Items)

    if ($Items.Count -eq 0) { return }

    Write-Host ""
    Write-Status "=== Properties ($($Items.Count) matches) ===" "Cyan"
    Write-Host ("-" * 80)

    foreach ($m in $Items) {
        $shortFile = Shorten-Path $m.file
        $accessors = @()
        if ($m.hasGet) { $accessors += "get" }
        if ($m.hasSet) { $accessors += "set" }
        $accStr = " { $($accessors -join '; ') }"

        Write-Status "  $($m.type) $($m.name)$accStr" "White"
        if ($m.className) {
            Write-Status "    class: $($m.className)" "Gray"
        }
        Write-Status "    file:  $shortFile`:$($m.line)" "DarkYellow"
    }
}

# ─── 主搜索逻辑 ────────────────────────────────────────────
[int]$totalMatches = 0
$offset = ($Page - 1) * $PageSize

if (-not $Query -and -not $Callers -and -not $Callees -and -not $Stats) {
    Write-Status "请指定搜索参数。使用 -Query, -Callers, -Callees, 或 -Stats" "Yellow"
    Write-Host ""
    Write-Status "示例:" "White"
    Write-Status "  .\search-index-sqlite.ps1 -Query 'ClientStore'" "Gray"
    Write-Status "  .\search-index-sqlite.ps1 -Callers 'ClientStore.GetData'" "Gray"
    Write-Status "  .\search-index-sqlite.ps1 -Stats" "Gray"
    exit 0
}

if ($Fts -and $Query) {
    # FTS 全文搜索模式
    Write-Host ""
    Write-Status "FTS 搜索: `"$Query`" (Top $MaxResults)" "Yellow"
    Write-Host ""

    $ftsResults = Search-FTS -Pattern $Query -Limit $MaxResults

    if ($ftsResults.Count -eq 0) {
        Write-Status "未找到匹配 `"$Query`" 的结果。" "Yellow"
        Write-Host ""
        Write-Status "提示: 如果是首次使用 FTS，请先运行: .\search-index-sqlite.ps1 -InitFts" "Gray"
    } else {
        Write-Status "找到 $($ftsResults.Count) 条匹配结果:" "Green"
        Write-Host ""

        $byKind = $ftsResults | Group-Object -Property kind
        foreach ($group in $byKind) {
            Write-Status "=== $($group.Name)s ($($group.Count)) ===" "Cyan"
            Write-Host ("-" * 80)
            foreach ($item in $group.Group) {
                $shortFile = Shorten-Path $item.filePath
                $nsInfo = if ($item.namespace) { " ($($item.namespace))" } else { "" }
                Write-Status "  $($item.name)$nsInfo" "White"
                Write-Status "    file: $shortFile" "DarkYellow"
            }
            Write-Host ""
        }

        $totalMatches = $ftsResults.Count
    }

    # 记录 FTS 统计
    $statsConn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
    Update-QueryStats -Conn $statsConn -QueryType "fts" -ResultCount $totalMatches
    $statsConn.Close()
    $statsConn.Dispose()

} elseif ($Query) {
    # 普通搜索模式
    Write-Host ""
    Write-Status "搜索: `"$Query`" (页码: $Page, 每页: $PageSize)" "Yellow"
    Write-Host ""

    if ($Type -eq "all" -or $Type -eq "class") {
        $classes = Search-Classes -Pattern $Query -Limit $MaxResults -Offset $offset
        if ($classes.Count -gt 0) {
            Show-Classes -Items $classes -Kind "Class"
            $totalMatches += $classes.Count
        }
    }

    if ($Type -eq "all" -or $Type -eq "interface") {
        $interfaces = Search-Interfaces -Pattern $Query -Limit $MaxResults -Offset $offset
        if ($interfaces.Count -gt 0) {
            Show-Classes -Items $interfaces -Kind "Interface"
            $totalMatches += $interfaces.Count
        }
    }

    if ($Type -eq "all" -or $Type -eq "method") {
        $methods = Search-Methods -Pattern $Query -Limit $MaxResults -Offset $offset
        if ($methods.Count -gt 0) {
            Show-Methods -Items $methods
            $totalMatches += $methods.Count
        }
    }

    if ($Type -eq "all" -or $Type -eq "property") {
        $properties = Search-Properties -Pattern $Query -Limit $MaxResults -Offset $offset
        if ($properties.Count -gt 0) {
            Show-Properties -Items $properties
            $totalMatches += $properties.Count
        }
    }

    # 记录普通搜索统计
    if ($totalMatches -gt 0) {
        $statsConn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $useWal
        # 根据搜索类型确定统计类型
        $queryType = "class"  # 默认
        if ($Type -eq "method") { $queryType = "method" }
        elseif ($Type -eq "interface") { $queryType = "class" }
        elseif ($Type -eq "property") { $queryType = "class" }
        Update-QueryStats -Conn $statsConn -QueryType $queryType -ResultCount $totalMatches
        $statsConn.Close()
        $statsConn.Dispose()
    }
}

# ─── 汇总 ──────────────────────────────────────────────────
Write-Host ""
if ($totalMatches -eq 0 -and $Query) {
    Write-Status "未找到匹配 `"$Query`" 的结果。" "Yellow"
} elseif ($totalMatches -gt 0) {
    Write-Status "共找到 $totalMatches 条匹配 `"$Query`" 的结果。" "Green"
}

# ─── 关闭连接 ──────────────────────────────────────────────
$conn.Close()
$conn.Dispose()
