<#
.SYNOPSIS
    SQLite 索引系统公共模块

.DESCRIPTION
    提取自 build/update/search-index-sqlite.ps1 的公共函数。
    使用方式：. $PSScriptRoot\index-common.ps1
#>

# ─── 配置加载 ─────────────────────────────────────────────
function Load-Config {
    param([string]$ConfigPath)

    if (-not $ConfigPath) {
        $ConfigPath = Join-Path $PSScriptRoot "config.json"
    }

    if (-not (Test-Path $ConfigPath)) {
        throw "配置文件不存在: $ConfigPath"
    }

    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json

    # 展开 ~ 路径
    if ($config.dbDir) {
        $config.dbDir = $config.dbDir -replace '^~', $env:USERPROFILE
    } elseif ($config.dbPath) {
        # 兼容旧配置
        $config.dbDir = Split-Path ($config.dbPath -replace '^~', $env:USERPROFILE) -Parent
    }
    $config.analyzerDir = $config.analyzerDir -replace '^~', $env:USERPROFILE

    return $config
}

# ─── 项目数据库路径 ──────────────────────────────────────
function Get-ProjectDbPath {
    param(
        [string]$ProjectPath,
        [string]$DbDir
    )

    # 获取项目目录名作为数据库名
    $projectDir = Split-Path $ProjectPath -Leaf
    # 清理非法文件名字符
    $dbName = $projectDir -replace '[\\/:*?"<>|]', '_'
    return Join-Path $DbDir "$dbName.db"
}

# ─── 日志 ─────────────────────────────────────────────────
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Verbose "[$ts][$Level] $Message"
}

function Write-Status {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
    Write-Host ("-" * 60)
}

function Write-Footer {
    param([string]$Title)
    Write-Host "=========================" -ForegroundColor Green
}

# ─── 文件哈希 ─────────────────────────────────────────────
function Get-FileHash256 {
    param([string]$Path)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            $hashBytes = $sha.ComputeHash($stream)
            return [BitConverter]::ToString($hashBytes).Replace("-", "")
        } finally {
            $stream.Dispose()
        }
    } finally {
        $sha.Dispose()
    }
}

# ─── SQLite 连接 ──────────────────────────────────────────
function Get-SqliteConnection {
    param(
        [string]$DbPath,
        [bool]$ReadOnly = $false,
        [bool]$UseWal = $true
    )

    # 设置 SQLite.Interop.dll 路径
    $config = Load-Config
    $version = $config.sqlite.version
    $interopPath = "$env:USERPROFILE\.nuget\packages\stub.system.data.sqlite.core.netstandard\$version\runtimes\win-x64\native"
    $env:PATH = "$interopPath;$env:PATH"

    # 加载 System.Data.SQLite
    $sqliteDll = "$env:USERPROFILE\.nuget\packages\stub.system.data.sqlite.core.netstandard\$version\lib\netstandard2.0\System.Data.SQLite.dll"
    if (-not (Test-Path $sqliteDll)) {
        throw "找不到 System.Data.SQLite DLL: $sqliteDll"
    }
    Add-Type -Path $sqliteDll

    # 构建连接字符串
    $connStr = "Data Source=$DbPath;Version=3;"
    if ($ReadOnly) {
        $connStr += "Read Only=True;"
    }

    $conn = New-Object System.Data.SQLite.SQLiteConnection($connStr)
    $conn.Open()

    # 启用外键约束
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "PRAGMA foreign_keys = ON;"
    $cmd.ExecuteNonQuery() | Out-Null
    $cmd.Dispose()

    # 启用 WAL 模式（提高并发性能）
    if ($UseWal -and -not $ReadOnly) {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "PRAGMA journal_mode = WAL;"
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()

        # 设置忙碌超时
        $busyTimeout = $config.sqlite.busyTimeout
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "PRAGMA busy_timeout = $busyTimeout;"
        $cmd.ExecuteNonQuery() | Out-Null
        $cmd.Dispose()
    }

    return $conn
}

# ─── 数据库初始化 ─────────────────────────────────────────
function Initialize-Database {
    param([System.Data.SQLite.SQLiteConnection]$Conn)

    $schema = @"
-- 文件表
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 类表
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    namespace TEXT,
    line INTEGER,
    base_types TEXT,
    is_static INTEGER DEFAULT 0,
    is_abstract INTEGER DEFAULT 0,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 接口表
CREATE TABLE IF NOT EXISTS interfaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    namespace TEXT,
    line INTEGER,
    base_types TEXT,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 方法表
CREATE TABLE IF NOT EXISTS methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    class_id INTEGER,
    name TEXT NOT NULL,
    return_type TEXT,
    line INTEGER,
    modifiers TEXT,
    parameters TEXT,
    is_public INTEGER DEFAULT 0,
    is_static INTEGER DEFAULT 0,
    is_async INTEGER DEFAULT 0,
    is_virtual INTEGER DEFAULT 0,
    is_override INTEGER DEFAULT 0,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- 属性表
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    class_id INTEGER,
    name TEXT NOT NULL,
    type TEXT,
    line INTEGER,
    has_get INTEGER DEFAULT 0,
    has_set INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,
    is_static INTEGER DEFAULT 0,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- 调用关系表
CREATE TABLE IF NOT EXISTS call_graph (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caller_id INTEGER,
    caller_name TEXT NOT NULL,
    callee_name TEXT NOT NULL,
    file_id INTEGER,
    line INTEGER,
    FOREIGN KEY (caller_id) REFERENCES methods(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 元数据表
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 索引加速查询
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
CREATE INDEX IF NOT EXISTS idx_classes_file_id ON classes(file_id);
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
CREATE INDEX IF NOT EXISTS idx_classes_namespace ON classes(namespace);
CREATE INDEX IF NOT EXISTS idx_interfaces_file_id ON interfaces(file_id);
CREATE INDEX IF NOT EXISTS idx_interfaces_name ON interfaces(name);
CREATE INDEX IF NOT EXISTS idx_methods_file_id ON methods(file_id);
CREATE INDEX IF NOT EXISTS idx_methods_class_id ON methods(class_id);
CREATE INDEX IF NOT EXISTS idx_methods_name ON methods(name);
CREATE INDEX IF NOT EXISTS idx_properties_file_id ON properties(file_id);
CREATE INDEX IF NOT EXISTS idx_properties_class_id ON properties(class_id);
CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);
CREATE INDEX IF NOT EXISTS idx_call_graph_caller_id ON call_graph(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_graph_caller_name ON call_graph(caller_name);
CREATE INDEX IF NOT EXISTS idx_call_graph_callee_name ON call_graph(callee_name);

-- 反向调用视图：查找谁调用了某方法
CREATE VIEW IF NOT EXISTS v_callers AS
SELECT
    cg.callee_name,
    cg.caller_name,
    m.return_type,
    m.parameters,
    m.modifiers,
    c.name as caller_class,
    f.path as file_path,
    cg.line
FROM call_graph cg
LEFT JOIN methods m ON cg.caller_id = m.id
LEFT JOIN classes c ON m.class_id = c.id
JOIN files f ON cg.file_id = f.id;

-- 统计视图
CREATE VIEW IF NOT EXISTS v_stats AS
SELECT
    (SELECT COUNT(*) FROM files) as total_files,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM interfaces) as total_interfaces,
    (SELECT COUNT(*) FROM methods) as total_methods,
    (SELECT COUNT(*) FROM properties) as total_properties,
    (SELECT COUNT(*) FROM call_graph) as total_call_edges,
    (SELECT COUNT(DISTINCT namespace) FROM classes WHERE namespace != '') as total_namespaces;

-- 命名空间统计视图
CREATE VIEW IF NOT EXISTS v_namespace_stats AS
SELECT
    namespace,
    COUNT(*) as class_count
FROM classes
WHERE namespace != ''
GROUP BY namespace
ORDER BY class_count DESC;
"@

    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = $schema
    $cmd.ExecuteNonQuery()
    $cmd.Dispose()
}

# ─── FTS5 全文搜索（可选） ────────────────────────────────
function Initialize-FTS5 {
    param([System.Data.SQLite.SQLiteConnection]$Conn)

    # 检查 FTS5 是否可用
    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = "SELECT sqlite_compileoption_used('ENABLE_FTS5');"
    $ftsEnabled = $cmd.ExecuteScalar()
    $cmd.Dispose()

    if (-not $ftsEnabled) {
        Write-Log "FTS5 未启用，跳过全文搜索表创建" "WARN"
        return $false
    }

    # 创建 FTS 虚拟表
    $ftsSchema = @"
-- 符号搜索表（FTS5 全文搜索）
CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
    name,
    namespace,
    kind,
    file_path,
    content=''
);

-- 类触发器
CREATE TRIGGER IF NOT EXISTS classes_ai AFTER INSERT ON classes BEGIN
    INSERT INTO symbols_fts(rowid, name, namespace, kind, file_path)
    VALUES (new.id, new.name, new.namespace, 'class', (SELECT path FROM files WHERE id = new.file_id));
END;

CREATE TRIGGER IF NOT EXISTS classes_ad AFTER DELETE ON classes BEGIN
    INSERT INTO symbols_fts(symbols_fts, rowid, name, namespace, kind, file_path)
    VALUES('delete', old.id, old.name, old.namespace, 'class', (SELECT path FROM files WHERE id = old.file_id));
END;

-- 接口触发器
CREATE TRIGGER IF NOT EXISTS interfaces_ai AFTER INSERT ON interfaces BEGIN
    INSERT INTO symbols_fts(rowid, name, namespace, kind, file_path)
    VALUES (new.id + 1000000, new.name, new.namespace, 'interface', (SELECT path FROM files WHERE id = new.file_id));
END;

CREATE TRIGGER IF NOT EXISTS interfaces_ad AFTER DELETE ON interfaces BEGIN
    INSERT INTO symbols_fts(symbols_fts, rowid, name, namespace, kind, file_path)
    VALUES('delete', old.id + 1000000, old.name, old.namespace, 'interface', (SELECT path FROM files WHERE id = old.file_id));
END;

-- 方法触发器
CREATE TRIGGER IF NOT EXISTS methods_ai AFTER INSERT ON methods BEGIN
    INSERT INTO symbols_fts(rowid, name, namespace, kind, file_path)
    VALUES (new.id + 2000000, new.name, '', 'method', (SELECT path FROM files WHERE id = new.file_id));
END;

CREATE TRIGGER IF NOT EXISTS methods_ad AFTER DELETE ON methods BEGIN
    INSERT INTO symbols_fts(symbols_fts, rowid, name, namespace, kind, file_path)
    VALUES('delete', old.id + 2000000, old.name, '', 'method', (SELECT path FROM files WHERE id = old.file_id));
END;
"@

    try {
        $cmd = $Conn.CreateCommand()
        $cmd.CommandText = $ftsSchema
        $cmd.ExecuteNonQuery()
        $cmd.Dispose()
        Write-Log "FTS5 全文搜索表已初始化"
        return $true
    } catch {
        Write-Log "FTS5 初始化失败: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# ─── 元数据操作 ───────────────────────────────────────────
function Get-MetaValue {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [string]$Key
    )

    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = "SELECT value FROM meta WHERE key = @key"
    $cmd.Parameters.AddWithValue("@key", $Key) | Out-Null
    $result = $cmd.ExecuteScalar()
    $cmd.Dispose()
    return $result
}

function Set-MetaValue {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [string]$Key,
        [string]$Value
    )

    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = "INSERT OR REPLACE INTO meta (key, value) VALUES (@key, @value)"
    $cmd.Parameters.AddWithValue("@key", $Key) | Out-Null
    $cmd.Parameters.AddWithValue("@value", $Value) | Out-Null
    $cmd.ExecuteNonQuery()
    $cmd.Dispose()
}

# ─── 路径处理 ─────────────────────────────────────────────
function Shorten-Path {
    param([string]$FullPath)

    if (-not $FullPath) { return "" }

    $config = Load-Config
    foreach ($root in $config.projectRoots) {
        if ($FullPath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
            return $FullPath.Substring($root.Length)
        }
    }
    return $FullPath
}

# ─── 文件扫描 ─────────────────────────────────────────────
function Get-CsFiles {
    param(
        [string]$ProjectPath,
        [string[]]$ExcludeDirs
    )

    if (-not $ExcludeDirs) {
        $config = Load-Config
        $ExcludeDirs = $config.excludeDirs
    }

    $excludePattern = ($ExcludeDirs | ForEach-Object { [regex]::Escape($_) }) -join '|'

    $csFiles = Get-ChildItem -Path $ProjectPath -Filter "*.cs" -Recurse -File |
        Where-Object { $_.FullName -notmatch "\\($excludePattern)\\" }

    return $csFiles
}

# ─── 统计查询 ─────────────────────────────────────────────
function Get-IndexStats {
    param([System.Data.SQLite.SQLiteConnection]$Conn)

    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = "SELECT * FROM v_stats"
    $reader = $cmd.ExecuteReader()

    $stats = [PSCustomObject]@{
        totalFiles = 0
        totalClasses = 0
        totalInterfaces = 0
        totalMethods = 0
        totalProperties = 0
        totalCallEdges = 0
        totalNamespaces = 0
    }

    if ($reader.Read()) {
        $stats.totalFiles = $reader.GetInt64(0)
        $stats.totalClasses = $reader.GetInt64(1)
        $stats.totalInterfaces = $reader.GetInt64(2)
        $stats.totalMethods = $reader.GetInt64(3)
        $stats.totalProperties = $reader.GetInt64(4)
        $stats.totalCallEdges = $reader.GetInt64(5)
        $stats.totalNamespaces = $reader.GetInt64(6)
    }

    $reader.Dispose()
    $cmd.Dispose()

    return $stats
}

function Show-IndexStats {
    param($Stats)

    Write-Header "索引统计"
    Write-Status "文件总数:     $($Stats.totalFiles)" "Cyan"
    Write-Status "类:           $($Stats.totalClasses)" "Cyan"
    Write-Status "接口:         $($Stats.totalInterfaces)" "Cyan"
    Write-Status "方法:         $($Stats.totalMethods)" "Cyan"
    Write-Status "属性:         $($Stats.totalProperties)" "Cyan"
    Write-Status "调用边:       $($Stats.totalCallEdges)" "Cyan"
    Write-Status "命名空间:     $($Stats.totalNamespaces)" "Cyan"
    Write-Footer
}

# ─── Token 统计 ────────────────────────────────────────────
# Token 估算规则（基于无索引时的 Read/Grep 操作）
$script:TokenEstimates = @{
    "class"     = @{ WithoutIndex = 5000; WithIndex = 200 }      # 类/接口查询
    "method"    = @{ WithoutIndex = 8000; WithIndex = 300 }      # 方法查询
    "caller"    = @{ WithoutIndex = 12000; WithIndex = 400 }     # 调用链查询
    "callee"    = @{ WithoutIndex = 12000; WithIndex = 400 }     # 被调用者查询
    "fts"       = @{ WithoutIndex = 6000; WithIndex = 250 }      # FTS 全文搜索
    "stats"     = @{ WithoutIndex = 3000; WithIndex = 150 }      # 统计查询
    "namespace" = @{ WithoutIndex = 4000; WithIndex = 180 }      # 命名空间查询
}

function Initialize-QueryStats {
    param([System.Data.SQLite.SQLiteConnection]$Conn)

    # 检查统计字段是否存在
    $cmd = $Conn.CreateCommand()
    $cmd.CommandText = "PRAGMA table_info(meta)"
    $reader = $cmd.ExecuteReader()
    $columns = @()
    while ($reader.Read()) {
        $columns += $reader.GetString(1)
    }
    $reader.Dispose()
    $cmd.Dispose()

    # 添加统计字段（如果不存在）
    $statsFields = @(
        @{ name = "query_count"; default = "0" },
        @{ name = "tokens_saved"; default = "0" },
        @{ name = "last_query_at"; default = "NULL" },
        @{ name = "class_query_count"; default = "0" },
        @{ name = "method_query_count"; default = "0" },
        @{ name = "caller_query_count"; default = "0" },
        @{ name = "callee_query_count"; default = "0" },
        @{ name = "fts_query_count"; default = "0" },
        @{ name = "stats_query_count"; default = "0" }
    )

    foreach ($field in $statsFields) {
        if ($field.name -notin $columns) {
            $cmd = $Conn.CreateCommand()
            $cmd.CommandText = "INSERT OR IGNORE INTO meta (key, value) VALUES ('$($field.name)', '$($field.default)')"
            $cmd.ExecuteNonQuery() | Out-Null
            $cmd.Dispose()
        }
    }
}

function Update-QueryStats {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [string]$QueryType,
        [int]$ResultCount = 0
    )

    # 初始化统计字段
    Initialize-QueryStats -Conn $Conn

    # 获取当前统计
    $queryCount = [int](Get-MetaValue -Conn $Conn -Key "query_count")
    $tokensSaved = [long](Get-MetaValue -Conn $Conn -Key "tokens_saved")
    $typeCount = [int](Get-MetaValue -Conn $Conn -Key "${QueryType}_query_count")

    # 计算本次节省的 tokens
    $estimate = $script:TokenEstimates[$QueryType]
    if ($estimate) {
        $saved = $estimate.WithoutIndex - $estimate.WithIndex
        $tokensSaved += $saved
    }

    # 更新统计
    $queryCount++
    $typeCount++

    Set-MetaValue -Conn $Conn -Key "query_count" -Value $queryCount.ToString()
    Set-MetaValue -Conn $Conn -Key "tokens_saved" -Value $tokensSaved.ToString()
    Set-MetaValue -Conn $Conn -Key "last_query_at" -Value (Get-Date -Format "o")
    Set-MetaValue -Conn $Conn -Key "${QueryType}_query_count" -Value $typeCount.ToString()
}

function Get-QueryStats {
    param([System.Data.SQLite.SQLiteConnection]$Conn)

    Initialize-QueryStats -Conn $Conn

    $queryCount = Get-MetaValue -Conn $Conn -Key "query_count"
    $tokensSaved = Get-MetaValue -Conn $Conn -Key "tokens_saved"
    $lastQueryAt = Get-MetaValue -Conn $Conn -Key "last_query_at"
    $classQueryCount = Get-MetaValue -Conn $Conn -Key "class_query_count"
    $methodQueryCount = Get-MetaValue -Conn $Conn -Key "method_query_count"
    $callerQueryCount = Get-MetaValue -Conn $Conn -Key "caller_query_count"
    $calleeQueryCount = Get-MetaValue -Conn $Conn -Key "callee_query_count"
    $ftsQueryCount = Get-MetaValue -Conn $Conn -Key "fts_query_count"
    $statsQueryCount = Get-MetaValue -Conn $Conn -Key "stats_query_count"

    $stats = [PSCustomObject]@{
        QueryCount = if ($queryCount) { [int]$queryCount } else { 0 }
        TokensSaved = if ($tokensSaved) { [long]$tokensSaved } else { 0 }
        LastQueryAt = $lastQueryAt
        ClassQueryCount = if ($classQueryCount) { [int]$classQueryCount } else { 0 }
        MethodQueryCount = if ($methodQueryCount) { [int]$methodQueryCount } else { 0 }
        CallerQueryCount = if ($callerQueryCount) { [int]$callerQueryCount } else { 0 }
        CalleeQueryCount = if ($calleeQueryCount) { [int]$calleeQueryCount } else { 0 }
        FtsQueryCount = if ($ftsQueryCount) { [int]$ftsQueryCount } else { 0 }
        StatsQueryCount = if ($statsQueryCount) { [int]$statsQueryCount } else { 0 }
    }

    return $stats
}

function Show-QueryStats {
    param($Stats)

    Write-Header "索引系统 Token 统计"
    Write-Status "总查询次数:     $($Stats.QueryCount)" "Cyan"
    Write-Status "估算节省:       $([math]::Round($Stats.TokensSaved / 1000, 1))K tokens (~$([math]::Round($Stats.TokensSaved / 1000000, 2))M)" "Green"
    Write-Status "最后查询:       $(if ($Stats.LastQueryAt) { $Stats.LastQueryAt } else { '无' })" "White"
    Write-Host ""
    Write-Status "按类型统计:" "Yellow"
    Write-Status "  类查询:       $($Stats.ClassQueryCount) 次 (节省 $([math]::Round($Stats.ClassQueryCount * 4800 / 1000, 1))K)" "White"
    Write-Status "  方法查询:     $($Stats.MethodQueryCount) 次 (节省 $([math]::Round($Stats.MethodQueryCount * 7700 / 1000, 1))K)" "White"
    Write-Status "  调用链查询:   $($Stats.CallerQueryCount) 次 (节省 $([math]::Round($Stats.CallerQueryCount * 11600 / 1000, 1))K)" "White"
    Write-Status "  被调用者查询: $($Stats.CalleeQueryCount) 次 (节省 $([math]::Round($Stats.CalleeQueryCount * 11600 / 1000, 1))K)" "White"
    Write-Status "  FTS 全文搜索: $($Stats.FtsQueryCount) 次 (节省 $([math]::Round($Stats.FtsQueryCount * 5750 / 1000, 1))K)" "White"
    Write-Status "  统计查询:     $($Stats.StatsQueryCount) 次 (节省 $([math]::Round($Stats.StatsQueryCount * 2850 / 1000, 1))K)" "White"
    Write-Footer
}

# ─── 函数列表（供参考）────────────────────────────────────
# Load-Config, Write-Log, Write-Status, Write-Header, Write-Footer
# Get-FileHash256, Get-SqliteConnection, Initialize-Database, Initialize-FTS5
# Get-MetaValue, Set-MetaValue, Shorten-Path, Get-CsFiles
# Get-IndexStats, Show-IndexStats
# Initialize-QueryStats, Update-QueryStats, Get-QueryStats, Show-QueryStats
