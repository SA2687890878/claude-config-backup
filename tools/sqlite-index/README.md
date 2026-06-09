# SQLite 索引系统 v3.0

## 概述

使用 SQLite 存储 C# 代码索引，提供高性能查询、全文搜索、调用链分析等功能。

## 架构

```
index-config.json      # 配置文件
index-common.ps1       # 公共模块
├── build-index-sqlite.ps1   # 构建索引
├── search-index-sqlite.ps1  # 搜索索引
└── update-index-sqlite.ps1  # 增量更新
```

## 数据库路径

默认：`~/.claude/cache/index.db`

## 数据库结构

### 表结构

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `files` | 文件信息 | id, path, hash, updated_at |
| `classes` | 类定义 | id, file_id, name, namespace, line, base_types |
| `interfaces` | 接口定义 | id, file_id, name, namespace, line, base_types |
| `methods` | 方法定义 | id, file_id, class_id, name, return_type, line, modifiers, parameters |
| `properties` | 属性定义 | id, file_id, class_id, name, type, line |
| `call_graph` | 调用关系 | id, caller_id, caller_name, callee_name, file_id |
| `meta` | 元数据 | key, value |
| `symbols_fts` | FTS5 全文搜索 | name, namespace, kind, file_path |

### 视图

| 视图名 | 说明 |
|--------|------|
| `v_callers` | 反向调用查询（谁调用了某方法） |
| `v_stats` | 索引统计信息 |
| `v_namespace_stats` | 命名空间分布统计 |

### 索引

- `idx_files_path` / `idx_files_hash` - 文件索引
- `idx_classes_name` / `idx_classes_namespace` - 类索引
- `idx_interfaces_name` - 接口索引
- `idx_methods_name` - 方法索引
- `idx_properties_name` - 属性索引
- `idx_call_graph_*` - 调用关系索引

## 使用方法

### 配置

编辑 `index-config.json`：

```json
{
  "dbPath": "~/.claude/cache/index.db",
  "excludeDirs": ["bin", "obj", "node_modules", ".git"],
  "projectRoots": ["F:\\Code WorkSpace\\"],
  "sqlite": {
    "useWal": true,
    "busyTimeout": 5000
  }
}
```

### 构建索引

```powershell
# 构建当前目录的索引
.\build-index-sqlite.ps1

# 指定项目路径
.\build-index-sqlite.ps1 -ProjectPath "F:\Code WorkSpace\pcs.crontabservice"

# 强制全量重建
.\build-index-sqlite.ps1 -FullRebuild
```

### 搜索索引

```powershell
# 搜索类名
.\search-index-sqlite.ps1 -Query "ClientStore"

# 搜索接口
.\search-index-sqlite.ps1 -Query "^IAuth" -Type interface

# 搜索方法（带分页）
.\search-index-sqlite.ps1 -Query "Login" -Type method -Page 2 -PageSize 10

# 按命名空间过滤
.\search-index-sqlite.ps1 -Query "Service" -Namespace "MyApp.Services"

# 正则搜索
.\search-index-sqlite.ps1 -Query "Auth.*Controller" -Type class
```

### 调用链查询

```powershell
# 查找谁调用了某方法
.\search-index-sqlite.ps1 -Callers "ClientStore.GetData"

# 查找某方法调用了谁
.\search-index-sqlite.ps1 -Callees "ClientStore.GetData"
```

### 全文搜索 (FTS5)

```powershell
# 首次使用需初始化 FTS 表
.\search-index-sqlite.ps1 -InitFts

# 使用 FTS 搜索（更快）
.\search-index-sqlite.ps1 -Query "ClientStore" -Fts
```

### 统计信息

```powershell
# 显示索引统计
.\search-index-sqlite.ps1 -Stats

# 显示 Token 统计（评估索引系统价值）
.\search-index-sqlite.ps1 -IndexStats
```

### 增量更新

```powershell
# 更新当前目录的索引
.\update-index-sqlite.ps1

# 指定路径
.\update-index-sqlite.ps1 -ProjectPath "F:\Code WorkSpace\pcs.crontabservice"
```

## v3.0 新特性

| 特性 | 说明 |
|------|------|
| **配置化** | JSON 配置文件，消除硬编码路径 |
| **WAL 模式** | 支持并发读写，提升性能 |
| **反向调用查询** | 查找谁调用了某方法 |
| **FTS5 全文搜索** | 更快的模糊匹配 |
| **统计视图** | 命名空间分布、索引统计 |
| **公共模块** | 代码复用，减少重复 |

## 与旧版本的对比

| 特性 | JSON 版 (v1) | SQLite v2 | SQLite v3 |
|------|--------------|-----------|-----------|
| 配置 | 硬编码 | 硬编码 | JSON 配置 |
| 并发 | 不支持 | WAL | WAL + busy_timeout |
| 调用链 | 单向 | 单向 | 双向 |
| 全文搜索 | 无 | 无 | FTS5 |
| 统计 | 无 | 基础 | 命名空间分布 |

## 依赖

- .NET 8.0 SDK（用于 Roslyn 分析器）
- System.Data.SQLite NuGet 包

## 注意事项

1. 首次运行会自动构建 Roslyn 分析器
2. 增量更新只处理变化的文件（SHA-256 哈希比对）
3. 数据库文件可随时删除重建
4. FTS 表需手动初始化（`-InitFts`）
5. WAL 模式提升并发性能，但需要 SQLite 支持
