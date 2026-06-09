<#
.SYNOPSIS
    C# 索引增量更新器 (SQLite 版)

.DESCRIPTION
    检查 .cs 文件变化（哈希比较），只重新解析变化的文件，增量更新 SQLite 数据库。

.PARAMETER ProjectPath
    要索引的项目路径，默认当前目录。

.PARAMETER DbPath
    SQLite 数据库路径，覆盖配置文件。

.EXAMPLE
    .\update-index-sqlite.ps1 -ProjectPath "F:\Code WorkSpace\pcs.crontabservice"
    .\update-index-sqlite.ps1
#>

[CmdletBinding()]
param(
    [string]$ProjectPath = ".",
    [string]$DbPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── 加载公共模块 ─────────────────────────────────────────
. $PSScriptRoot\common.ps1

# ─── 加载配置 ─────────────────────────────────────────────
$config = Load-Config

# ─── 确定数据库路径 ───────────────────────────────────────
if ($DbPath) {
    # 显式指定数据库路径
    $config | Add-Member -NotePropertyName "dbPath" -NotePropertyValue $DbPath -Force
} else {
    # 根据项目路径生成独立数据库
    $absProjectPath = (Resolve-Path $ProjectPath).Path
    $dbPath = Get-ProjectDbPath -ProjectPath $absProjectPath -DbDir $config.dbDir
    $config | Add-Member -NotePropertyName "dbPath" -NotePropertyValue $dbPath -Force
}

$cacheDir = Split-Path $config.dbPath -Parent

# ─── C# 分析器源码（与 build-index-sqlite.ps1 相同）───────
$AnalyzerSource = @'
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace BuildIndex;

public record TypeInfo(string Name, string FullName, string Kind, string Namespace, string File, int Line, string[] BaseTypes, bool IsStatic, bool IsAbstract);
public record PropertyInfo(string Name, string Type, string Owner, string File, int Line, bool HasGet, bool HasSet, bool IsPublic, bool IsStatic);
public record ParamInfo(string Name, string Type);
public record MethodInfo(string Name, string ReturnType, string Owner, string File, int Line, ParamInfo[] Parameters, bool IsPublic, bool IsStatic, bool IsAsync, bool IsVirtual, bool IsOverride);
public record CallEdge(string Caller, string Callee, string File, int Line);
public record FileSymbols(TypeInfo[] Classes, TypeInfo[] Interfaces, MethodInfo[] Methods, PropertyInfo[] Properties, CallEdge[] Calls);

public static class Analyzer
{
    public static FileSymbols AnalyzeFile(string filePath)
    {
        var content = System.IO.File.ReadAllText(filePath, System.Text.Encoding.UTF8);
        var tree = CSharpSyntaxTree.ParseText(content, path: filePath);
        var root = tree.GetCompilationUnitRoot();

        var classes = new List<TypeInfo>();
        var interfaces = new List<TypeInfo>();
        var methods = new List<MethodInfo>();
        var properties = new List<PropertyInfo>();
        var calls = new List<CallEdge>();

        foreach (var typeDecl in root.DescendantNodes().OfType<TypeDeclarationSyntax>())
        {
            var ns = typeDecl.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().FirstOrDefault()?.Name?.ToString() ?? "";
            var fullType = string.IsNullOrEmpty(ns) ? typeDecl.Identifier.Text : $"{ns}.{typeDecl.Identifier.Text}";
            var kind = typeDecl is InterfaceDeclarationSyntax ? "interface" : "class";
            var baseTypes = typeDecl.BaseList?.Types.Select(t => t.Type.ToString()).ToArray() ?? Array.Empty<string>();
            var line = typeDecl.GetLocation().GetLineSpan().Span.Start.Line + 1;
            var isStatic = typeDecl.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword));
            var isAbstract = typeDecl.Modifiers.Any(m => m.IsKind(SyntaxKind.AbstractKeyword));

            var typeInfo = new TypeInfo(typeDecl.Identifier.Text, fullType, kind, ns, filePath, line, baseTypes, isStatic, isAbstract);

            if (kind == "interface") interfaces.Add(typeInfo);
            else classes.Add(typeInfo);

            // 属性
            foreach (var prop in typeDecl.DescendantNodes().OfType<PropertyDeclarationSyntax>()
                         .Where(p => p.Parent is TypeDeclarationSyntax td && td.Identifier.Text == typeDecl.Identifier.Text))
            {
                var hasGet = prop.AccessorList?.Accessors.Any(a => a.IsKind(SyntaxKind.GetAccessorDeclaration)) ?? false;
                var hasSet = prop.AccessorList?.Accessors.Any(a => a.IsKind(SyntaxKind.SetAccessorDeclaration)) ?? false;
                properties.Add(new PropertyInfo(
                    prop.Identifier.Text, prop.Type.ToString(), fullType, filePath,
                    prop.GetLocation().GetLineSpan().Span.Start.Line + 1,
                    hasGet, hasSet,
                    prop.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)),
                    prop.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword))));
            }

            // 方法
            foreach (var method in typeDecl.DescendantNodes().OfType<MethodDeclarationSyntax>()
                         .Where(m => m.Parent is TypeDeclarationSyntax td && td.Identifier.Text == typeDecl.Identifier.Text))
            {
                var parms = method.ParameterList.Parameters.Select(p => new ParamInfo(p.Identifier.Text, p.Type?.ToString() ?? "")).ToArray();
                methods.Add(new MethodInfo(
                    method.Identifier.Text, method.ReturnType.ToString(), fullType, filePath,
                    method.GetLocation().GetLineSpan().Span.Start.Line + 1,
                    parms,
                    method.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)),
                    method.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword)),
                    method.Modifiers.Any(m => m.IsKind(SyntaxKind.AsyncKeyword)),
                    method.Modifiers.Any(m => m.IsKind(SyntaxKind.VirtualKeyword)),
                    method.Modifiers.Any(m => m.IsKind(SyntaxKind.OverrideKeyword))));

                // 调用关系
                foreach (var inv in method.DescendantNodes().OfType<InvocationExpressionSyntax>())
                {
                    var callee = inv.Expression.ToString();
                    if (callee.Length > 2 && !System.Text.RegularExpressions.Regex.IsMatch(callee, @"^(if|for|while|switch|return|await|new|throw|var)$"))
                    {
                        calls.Add(new CallEdge($"{fullType}.{method.Identifier.Text}", callee, filePath,
                            inv.GetLocation().GetLineSpan().Span.Start.Line + 1));
                    }
                }
            }
        }

        return new FileSymbols(classes.ToArray(), interfaces.ToArray(), methods.ToArray(), properties.ToArray(), calls.ToArray());
    }

    public static string Run(string[] filePaths)
    {
        var allClasses = new List<TypeInfo>();
        var allInterfaces = new List<TypeInfo>();
        var allMethods = new List<MethodInfo>();
        var allProperties = new List<PropertyInfo>();
        var allCalls = new List<CallEdge>();
        var errors = new List<string>();
        int parsed = 0;

        foreach (var f in filePaths)
        {
            try
            {
                var result = AnalyzeFile(f);
                allClasses.AddRange(result.Classes);
                allInterfaces.AddRange(result.Interfaces);
                allMethods.AddRange(result.Methods);
                allProperties.AddRange(result.Properties);
                allCalls.AddRange(result.Calls);
                parsed++;
            }
            catch (Exception ex)
            {
                errors.Add($"{Path.GetFileName(f)}: {ex.Message}");
            }
        }

        var output = new
        {
            classes = allClasses,
            interfaces = allInterfaces,
            methods = allMethods,
            properties = allProperties,
            callGraph = allCalls,
            stats = new
            {
                parsedFiles = parsed,
                errorCount = errors.Count,
                classes = allClasses.Count,
                interfaces = allInterfaces.Count,
                methods = allMethods.Count,
                properties = allProperties.Count,
                callEdges = allCalls.Count
            },
            errors = errors.ToArray()
        };

        return JsonSerializer.Serialize(output, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });
    }

    public static void Main(string[] args)
    {
        // 支持从文件读取路径列表（每行一个路径）
        var filePaths = new List<string>();
        foreach (var arg in args)
        {
            if (File.Exists(arg) && Path.GetExtension(arg).Equals(".txt", StringComparison.OrdinalIgnoreCase))
            {
                filePaths.AddRange(File.ReadAllLines(arg).Where(l => !string.IsNullOrWhiteSpace(l)));
            }
            else
            {
                filePaths.Add(arg);
            }
        }
        Console.WriteLine(Run(filePaths.ToArray()));
    }
}
'@

# ─── 索引构建器项目 ────────────────────────────────────────
function Get-OrBuild-Analyzer {
    $analyzerDir = $config.analyzerDir

    $hashFile = Join-Path $analyzerDir ".src-hash"
    $currentHash = [BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash(
            [System.Text.Encoding]::UTF8.GetBytes($AnalyzerSource)
        )
    ).Replace("-", "")

    if ((Test-Path $hashFile) -and (Get-Content $hashFile -Raw).Trim() -eq $currentHash) {
        $dllPath = Join-Path $analyzerDir "bin\Release\$($config.analyzer.targetFramework)\BuildIndex.dll"
        if (Test-Path $dllPath) {
            Write-Log "分析器已就绪（未变更）"
            return $dllPath
        }
    }

    Write-Log "构建分析器..."
    if (Test-Path $analyzerDir) { Remove-Item $analyzerDir -Recurse -Force }
    New-Item -ItemType Directory -Path $analyzerDir -Force | Out-Null

    $csproj = @"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>$($config.analyzer.targetFramework)</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp" Version="$($config.analyzer.roslynVersion)" />
  </ItemGroup>
</Project>
"@

    Set-Content (Join-Path $analyzerDir "BuildIndex.csproj") $csproj -Encoding UTF8

    $srcDir = Join-Path $analyzerDir "src"
    New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
    Set-Content (Join-Path $srcDir "Program.cs") $AnalyzerSource -Encoding UTF8

    $buildOutput = & dotnet build $analyzerDir -c Release 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "分析器构建失败: $buildOutput"
    }

    Set-Content $hashFile $currentHash -Encoding UTF8
    Write-Log "分析器构建完成"
    return (Join-Path $analyzerDir "bin\Release\$($config.analyzer.targetFramework)\BuildIndex.dll")
}

# ─── 写入 SQLite ──────────────────────────────────────────
function Save-ToSqlite {
    param(
        [System.Data.SQLite.SQLiteConnection]$Conn,
        [object]$AnalysisResult,
        [hashtable]$FileHashMap
    )

    $transaction = $Conn.BeginTransaction()
    try {
        # 1. 插入文件记录
        $insertFile = $Conn.CreateCommand()
        $insertFile.CommandText = @"
INSERT OR REPLACE INTO files (path, hash, updated_at)
VALUES (@path, @hash, datetime('now'))
"@
        $null = $insertFile.Parameters.Add("@path", [System.Data.DbType]::String)
        $null = $insertFile.Parameters.Add("@hash", [System.Data.DbType]::String)

        $fileIdMap = @{}

        foreach ($entry in $FileHashMap.GetEnumerator()) {
            $insertFile.Parameters["@path"].Value = $entry.Key
            $insertFile.Parameters["@hash"].Value = $entry.Value
            $insertFile.ExecuteNonQuery()

            $getIdCmd = $Conn.CreateCommand()
            $getIdCmd.CommandText = "SELECT id FROM files WHERE path = @path"
            $null = $getIdCmd.Parameters.Add("@path", [System.Data.DbType]::String)
            $getIdCmd.Parameters["@path"].Value = $entry.Key
            $fileIdMap[$entry.Key] = [long]$getIdCmd.ExecuteScalar()
            $getIdCmd.Dispose()
        }
        $insertFile.Dispose()

        # 2. 插入类
        $insertClass = $Conn.CreateCommand()
        $insertClass.CommandText = @"
INSERT INTO classes (file_id, name, namespace, line, base_types, is_static, is_abstract)
VALUES (@file_id, @name, @namespace, @line, @base_types, @is_static, @is_abstract)
"@
        $null = $insertClass.Parameters.Add("@file_id", [System.Data.DbType]::Int64)
        $null = $insertClass.Parameters.Add("@name", [System.Data.DbType]::String)
        $null = $insertClass.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $null = $insertClass.Parameters.Add("@line", [System.Data.DbType]::Int32)
        $null = $insertClass.Parameters.Add("@base_types", [System.Data.DbType]::String)
        $null = $insertClass.Parameters.Add("@is_static", [System.Data.DbType]::Int32)
        $null = $insertClass.Parameters.Add("@is_abstract", [System.Data.DbType]::Int32)

        $classIdMap = @{}

        if ($AnalysisResult.classes) {
            foreach ($cls in $AnalysisResult.classes) {
                $fid = $fileIdMap[$cls.file]
                if (-not $fid) { continue }
                $insertClass.Parameters["@file_id"].Value = $fid
                $insertClass.Parameters["@name"].Value = $cls.name
                $insertClass.Parameters["@namespace"].Value = $cls.namespace
                $insertClass.Parameters["@line"].Value = [int]$cls.line
                $insertClass.Parameters["@base_types"].Value = ($cls.baseTypes -join ";")
                $insertClass.Parameters["@is_static"].Value = if ($cls.isStatic) { 1 } else { 0 }
                $insertClass.Parameters["@is_abstract"].Value = if ($cls.isAbstract) { 1 } else { 0 }
                $insertClass.ExecuteNonQuery()

                $getIdCmd = $Conn.CreateCommand()
                $getIdCmd.CommandText = "SELECT last_insert_rowid()"
                $classIdMap["$($cls.file):$($cls.fullName)"] = [long]$getIdCmd.ExecuteScalar()
                $getIdCmd.Dispose()
            }
        }
        $insertClass.Dispose()

        # 3. 插入接口
        $insertInterface = $Conn.CreateCommand()
        $insertInterface.CommandText = @"
INSERT INTO interfaces (file_id, name, namespace, line, base_types)
VALUES (@file_id, @name, @namespace, @line, @base_types)
"@
        $null = $insertInterface.Parameters.Add("@file_id", [System.Data.DbType]::Int64)
        $null = $insertInterface.Parameters.Add("@name", [System.Data.DbType]::String)
        $null = $insertInterface.Parameters.Add("@namespace", [System.Data.DbType]::String)
        $null = $insertInterface.Parameters.Add("@line", [System.Data.DbType]::Int32)
        $null = $insertInterface.Parameters.Add("@base_types", [System.Data.DbType]::String)

        if ($AnalysisResult.interfaces) {
            foreach ($iface in $AnalysisResult.interfaces) {
                $fid = $fileIdMap[$iface.file]
                if (-not $fid) { continue }
                $insertInterface.Parameters["@file_id"].Value = $fid
                $insertInterface.Parameters["@name"].Value = $iface.name
                $insertInterface.Parameters["@namespace"].Value = $iface.namespace
                $insertInterface.Parameters["@line"].Value = [int]$iface.line
                $insertInterface.Parameters["@base_types"].Value = ($iface.baseTypes -join ";")
                $insertInterface.ExecuteNonQuery()
            }
        }
        $insertInterface.Dispose()

        # 4. 插入方法
        $insertMethod = $Conn.CreateCommand()
        $insertMethod.CommandText = @"
INSERT INTO methods (file_id, class_id, name, return_type, line, modifiers, parameters, is_public, is_static, is_async, is_virtual, is_override)
VALUES (@file_id, @class_id, @name, @return_type, @line, @modifiers, @parameters, @is_public, @is_static, @is_async, @is_virtual, @is_override)
"@
        $null = $insertMethod.Parameters.Add("@file_id", [System.Data.DbType]::Int64)
        $null = $insertMethod.Parameters.Add("@class_id", [System.Data.DbType]::Int64)
        $null = $insertMethod.Parameters.Add("@name", [System.Data.DbType]::String)
        $null = $insertMethod.Parameters.Add("@return_type", [System.Data.DbType]::String)
        $null = $insertMethod.Parameters.Add("@line", [System.Data.DbType]::Int32)
        $null = $insertMethod.Parameters.Add("@modifiers", [System.Data.DbType]::String)
        $null = $insertMethod.Parameters.Add("@parameters", [System.Data.DbType]::String)
        $null = $insertMethod.Parameters.Add("@is_public", [System.Data.DbType]::Int32)
        $null = $insertMethod.Parameters.Add("@is_static", [System.Data.DbType]::Int32)
        $null = $insertMethod.Parameters.Add("@is_async", [System.Data.DbType]::Int32)
        $null = $insertMethod.Parameters.Add("@is_virtual", [System.Data.DbType]::Int32)
        $null = $insertMethod.Parameters.Add("@is_override", [System.Data.DbType]::Int32)

        $methodIdMap = @{}

        if ($AnalysisResult.methods) {
            foreach ($m in $AnalysisResult.methods) {
                $fid = $fileIdMap[$m.file]
                if (-not $fid) { continue }

                $cid = $classIdMap["$($m.file):$($m.owner)"]
                if (-not $cid) { $cid = [DBNull]::Value }

                $insertMethod.Parameters["@file_id"].Value = $fid
                $insertMethod.Parameters["@class_id"].Value = $cid
                $insertMethod.Parameters["@name"].Value = $m.name
                $insertMethod.Parameters["@return_type"].Value = $m.returnType
                $insertMethod.Parameters["@line"].Value = [int]$m.line
                $mods = @()
                if ($m.isPublic) { $mods += "public" } else { $mods += "private" }
                if ($m.isStatic) { $mods += "static" }
                if ($m.isAsync) { $mods += "async" }
                if ($m.isVirtual) { $mods += "virtual" }
                if ($m.isOverride) { $mods += "override" }
                $insertMethod.Parameters["@modifiers"].Value = ($mods -join ",")
                $params = @()
                if ($m.parameters) {
                    foreach ($p in $m.parameters) { $params += "$($p.type) $($p.name)" }
                }
                $insertMethod.Parameters["@parameters"].Value = ($params -join ", ")
                $insertMethod.Parameters["@is_public"].Value = if ($m.isPublic) { 1 } else { 0 }
                $insertMethod.Parameters["@is_static"].Value = if ($m.isStatic) { 1 } else { 0 }
                $insertMethod.Parameters["@is_async"].Value = if ($m.isAsync) { 1 } else { 0 }
                $insertMethod.Parameters["@is_virtual"].Value = if ($m.isVirtual) { 1 } else { 0 }
                $insertMethod.Parameters["@is_override"].Value = if ($m.isOverride) { 1 } else { 0 }
                $insertMethod.ExecuteNonQuery()

                $getIdCmd = $Conn.CreateCommand()
                $getIdCmd.CommandText = "SELECT last_insert_rowid()"
                $methodIdMap["$($m.file):$($m.owner).$($m.name)"] = [long]$getIdCmd.ExecuteScalar()
                $getIdCmd.Dispose()
            }
        }
        $insertMethod.Dispose()

        # 5. 插入属性
        $insertProp = $Conn.CreateCommand()
        $insertProp.CommandText = @"
INSERT INTO properties (file_id, class_id, name, type, line, has_get, has_set, is_public, is_static)
VALUES (@file_id, @class_id, @name, @type, @line, @has_get, @has_set, @is_public, @is_static)
"@
        $null = $insertProp.Parameters.Add("@file_id", [System.Data.DbType]::Int64)
        $null = $insertProp.Parameters.Add("@class_id", [System.Data.DbType]::Int64)
        $null = $insertProp.Parameters.Add("@name", [System.Data.DbType]::String)
        $null = $insertProp.Parameters.Add("@type", [System.Data.DbType]::String)
        $null = $insertProp.Parameters.Add("@line", [System.Data.DbType]::Int32)
        $null = $insertProp.Parameters.Add("@has_get", [System.Data.DbType]::Int32)
        $null = $insertProp.Parameters.Add("@has_set", [System.Data.DbType]::Int32)
        $null = $insertProp.Parameters.Add("@is_public", [System.Data.DbType]::Int32)
        $null = $insertProp.Parameters.Add("@is_static", [System.Data.DbType]::Int32)

        if ($AnalysisResult.properties) {
            foreach ($p in $AnalysisResult.properties) {
                $fid = $fileIdMap[$p.file]
                if (-not $fid) { continue }
                $cid = $classIdMap["$($p.file):$($p.owner)"]
                if (-not $cid) { $cid = [DBNull]::Value }

                $insertProp.Parameters["@file_id"].Value = $fid
                $insertProp.Parameters["@class_id"].Value = $cid
                $insertProp.Parameters["@name"].Value = $p.name
                $insertProp.Parameters["@type"].Value = $p.type
                $insertProp.Parameters["@line"].Value = [int]$p.line
                $insertProp.Parameters["@has_get"].Value = if ($p.hasGet) { 1 } else { 0 }
                $insertProp.Parameters["@has_set"].Value = if ($p.hasSet) { 1 } else { 0 }
                $insertProp.Parameters["@is_public"].Value = if ($p.isPublic) { 1 } else { 0 }
                $insertProp.Parameters["@is_static"].Value = if ($p.isStatic) { 1 } else { 0 }
                $insertProp.ExecuteNonQuery()
            }
        }
        $insertProp.Dispose()

        # 6. 插入调用关系
        $insertCall = $Conn.CreateCommand()
        $insertCall.CommandText = @"
INSERT INTO call_graph (caller_id, caller_name, callee_name, file_id, line)
VALUES (@caller_id, @caller_name, @callee_name, @file_id, @line)
"@
        $null = $insertCall.Parameters.Add("@caller_id", [System.Data.DbType]::Int64)
        $null = $insertCall.Parameters.Add("@caller_name", [System.Data.DbType]::String)
        $null = $insertCall.Parameters.Add("@callee_name", [System.Data.DbType]::String)
        $null = $insertCall.Parameters.Add("@file_id", [System.Data.DbType]::Int64)
        $null = $insertCall.Parameters.Add("@line", [System.Data.DbType]::Int32)

        if ($AnalysisResult.callGraph) {
            foreach ($call in $AnalysisResult.callGraph) {
                $fid = $fileIdMap[$call.file]
                if (-not $fid) { continue }

                $callerId = $methodIdMap["$($call.file):$($call.caller)"]
                if (-not $callerId) { $callerId = [DBNull]::Value }

                $insertCall.Parameters["@caller_id"].Value = $callerId
                $insertCall.Parameters["@caller_name"].Value = $call.caller
                $insertCall.Parameters["@callee_name"].Value = $call.callee
                $insertCall.Parameters["@file_id"].Value = $fid
                $insertCall.Parameters["@line"].Value = [int]$call.line
                $insertCall.ExecuteNonQuery()
            }
        }
        $insertCall.Dispose()

        $transaction.Commit()
    } catch {
        $transaction.Rollback()
        throw
    }
}

# ─── 主逻辑 ───────────────────────────────────────────────
function Update-Index {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    $absProjectPath = (Resolve-Path $ProjectPath).Path

    # 1. 初始化数据库
    if (-not (Test-Path $cacheDir)) {
        New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    }

    $conn = Get-SqliteConnection -DbPath $config.dbPath -UseWal $config.sqlite.useWal
    Initialize-Database -Conn $conn

    # 2. 获取所有 .cs 文件
    $csFiles = Get-CsFiles -ProjectPath $ProjectPath
    Write-Log "找到 $($csFiles.Count) 个 .cs 文件"

    # 3. 构建当前文件哈希映射
    $currentHashes = @{}
    foreach ($file in $csFiles) {
        $currentHashes[$file.FullName] = Get-FileHash256 -Path $file.FullName
    }

    # 4. 读取已缓存的哈希
    $cachedHashes = @{}
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT path, hash FROM files"
    $reader = $cmd.ExecuteReader()
    while ($reader.Read()) {
        $cachedHashes[$reader.GetString(0)] = $reader.GetString(1)
    }
    $reader.Dispose()
    $cmd.Dispose()

    # 5. 分类文件：新增、修改、删除、未变更
    $addedFiles = @()
    $modifiedFiles = @()
    $deletedFiles = @()
    $unchangedFiles = @()

    foreach ($file in $csFiles) {
        $path = $file.FullName
        $currentHash = $currentHashes[$path]

        if (-not $cachedHashes.ContainsKey($path)) {
            $addedFiles += $path
        } elseif ($cachedHashes[$path] -ne $currentHash) {
            $modifiedFiles += $path
        } else {
            $unchangedFiles += $path
        }
    }

    foreach ($cachedPath in $cachedHashes.Keys) {
        if (-not $currentHashes.ContainsKey($cachedPath)) {
            $deletedFiles += $cachedPath
        }
    }

    Write-Log "变化统计：新增 $($addedFiles.Count)，修改 $($modifiedFiles.Count)，删除 $($deletedFiles.Count)，未变更 $($unchangedFiles.Count)"

    # 6. 如果没有变化，显示"索引已是最新"
    if ($addedFiles.Count -eq 0 -and $modifiedFiles.Count -eq 0 -and $deletedFiles.Count -eq 0) {
        Write-Host ""
        Write-Status "索引已是最新，无需更新。" "Green"

        $stats = Get-IndexStats -Conn $conn
        Show-IndexStats -Stats $stats

        Write-Status "耗时:       $($sw.Elapsed.TotalSeconds.ToString('F2'))s" "White"
        $conn.Close()
        $conn.Dispose()
        return
    }

    # 7. 处理删除的文件
    if ($deletedFiles.Count -gt 0) {
        Write-Log "删除 $($deletedFiles.Count) 个文件的索引..."
        $deleteTransaction = $conn.BeginTransaction()
        try {
            foreach ($filePath in $deletedFiles) {
                $deleteCmd = $conn.CreateCommand()
                $deleteCmd.CommandText = "DELETE FROM files WHERE path = @path"
                $null = $deleteCmd.Parameters.Add("@path", [System.Data.DbType]::String)
                $deleteCmd.Parameters["@path"].Value = $filePath
                $deleteCmd.ExecuteNonQuery()
                $deleteCmd.Dispose()
            }
            $deleteTransaction.Commit()
        } catch {
            $deleteTransaction.Rollback()
            throw
        }
    }

    # 8. 处理修改的文件（先删除旧数据）
    $filesToParse = @($addedFiles + $modifiedFiles)

    if ($modifiedFiles.Count -gt 0) {
        Write-Log "清除 $($modifiedFiles.Count) 个修改文件的旧索引..."
        $clearTransaction = $conn.BeginTransaction()
        try {
            foreach ($filePath in $modifiedFiles) {
                $getIdCmd = $conn.CreateCommand()
                $getIdCmd.CommandText = "SELECT id FROM files WHERE path = @path"
                $null = $getIdCmd.Parameters.Add("@path", [System.Data.DbType]::String)
                $getIdCmd.Parameters["@path"].Value = $filePath
                $fileId = $getIdCmd.ExecuteScalar()
                $getIdCmd.Dispose()

                if ($fileId) {
                    $deleteCmd = $conn.CreateCommand()
                    $deleteCmd.CommandText = "DELETE FROM files WHERE id = @fid"
                    $null = $deleteCmd.Parameters.Add("@fid", [System.Data.DbType]::Int64)
                    $deleteCmd.Parameters["@fid"].Value = [long]$fileId
                    $deleteCmd.ExecuteNonQuery()
                    $deleteCmd.Dispose()
                }
            }
            $clearTransaction.Commit()
        } catch {
            $clearTransaction.Rollback()
            throw
        }
    }

    # 9. 如果没有需要解析的文件，直接返回
    if ($filesToParse.Count -eq 0) {
        Write-Header "索引增量更新完成"
        Write-Status "项目路径:   $absProjectPath" "White"
        Write-Status "数据库:     $($config.dbPath)" "White"
        Write-Status "删除文件:   $($deletedFiles.Count)" "White"
        Write-Status "耗时:       $($sw.Elapsed.TotalSeconds.ToString('F2'))s" "White"
        Write-Footer
        $conn.Close()
        $conn.Dispose()
        return
    }

    # 10. 获取分析器
    $analyzerDll = Get-OrBuild-Analyzer

    # 11. 运行分析器解析变化的文件（通过临时文件传路径，避免命令行过长）
    Write-Log "解析 $($filesToParse.Count) 个文件..."

    $analyzerOutputDir = Split-Path $analyzerDll -Parent
    $batchSize = 200
    $allClasses = @()
    $allInterfaces = @()
    $allMethods = @()
    $allProperties = @()
    $allCalls = @()
    $allErrors = @()
    $totalParsed = 0

    for ($i = 0; $i -lt $filesToParse.Count; $i += $batchSize) {
        $batch = $filesToParse[$i..([Math]::Min($i + $batchSize - 1, $filesToParse.Count - 1))]
        $batchNum = [Math]::Floor($i / $batchSize) + 1
        $totalBatches = [Math]::Ceiling($filesToParse.Count / $batchSize)
        Write-Log "处理批次 $batchNum/$totalBatches（$($batch.Count) 个文件）..."

        $batchFile = Join-Path $cacheDir "batch_$batchNum.txt"
        $batch | Set-Content -Path $batchFile -Encoding UTF8

        $jsonOutput = & dotnet $analyzerDll $batchFile 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "批次 $batchNum 执行失败: $jsonOutput" "WARN"
            continue
        }

        $batchResult = $jsonOutput | ConvertFrom-Json
        $allClasses += $batchResult.classes
        $allInterfaces += $batchResult.interfaces
        $allMethods += $batchResult.methods
        $allProperties += $batchResult.properties
        $allCalls += $batchResult.callGraph
        $allErrors += $batchResult.errors
        $totalParsed += $batchResult.stats.parsedFiles

        Remove-Item $batchFile -ErrorAction SilentlyContinue
    }

    $analysisResult = [PSCustomObject]@{
        classes    = $allClasses
        interfaces = $allInterfaces
        methods    = $allMethods
        properties = $allProperties
        callGraph  = $allCalls
        stats      = [PSCustomObject]@{
            parsedFiles = $totalParsed
            errorCount  = $allErrors.Count
            classes     = $allClasses.Count
            interfaces  = $allInterfaces.Count
            methods     = $allMethods.Count
            properties  = $allProperties.Count
            callEdges   = $allCalls.Count
        }
        errors     = $allErrors
    }

    Write-Log "解析完成：$($analysisResult.stats.parsedFiles) 个文件，$($analysisResult.stats.errorCount) 个错误"

    # 12. 写入数据库
    $changedHashes = @{}
    foreach ($filePath in $filesToParse) {
        $changedHashes[$filePath] = $currentHashes[$filePath]
    }
    Save-ToSqlite -Conn $conn -AnalysisResult $analysisResult -FileHashMap $changedHashes

    # 13. 更新元数据
    Set-MetaValue -Conn $conn -Key "version" -Value "3.0.0"
    Set-MetaValue -Conn $conn -Key "generated_at" -Value (Get-Date -Format "o")
    Set-MetaValue -Conn $conn -Key "project_path" -Value $absProjectPath

    # 14. 统计
    $stats = Get-IndexStats -Conn $conn

    $sw.Stop()

    Write-Header "索引增量更新完成"
    Write-Status "项目路径:   $absProjectPath" "White"
    Write-Status "数据库:     $($config.dbPath)" "White"
    Write-Status "文件总数:   $($stats.totalFiles)" "White"
    Write-Status "新增文件:   $($addedFiles.Count)" "Green"
    Write-Status "修改文件:   $($modifiedFiles.Count)" "Yellow"
    Write-Status "删除文件:   $($deletedFiles.Count)" "Red"
    Write-Status "未变更文件: $($unchangedFiles.Count)" "White"
    Write-Status "解析错误:   $($analysisResult.stats.errorCount)" "Yellow"
    Write-Status "类:         $($stats.totalClasses)" "Cyan"
    Write-Status "接口:       $($stats.totalInterfaces)" "Cyan"
    Write-Status "方法:       $($stats.totalMethods)" "Cyan"
    Write-Status "属性:       $($stats.totalProperties)" "Cyan"
    Write-Status "调用边:     $($stats.totalCallEdges)" "Cyan"
    Write-Status "耗时:       $($sw.Elapsed.TotalSeconds.ToString('F2'))s" "White"
    Write-Footer

    # 输出错误详情
    if ($analysisResult -and $analysisResult.errors.Count -gt 0) {
        Write-Host ""
        Write-Status "错误详情:" "Yellow"
        foreach ($err in $analysisResult.errors) {
            Write-Status "  - $err" "Yellow"
        }
    }

    $conn.Close()
    $conn.Dispose()
}

# ─── 执行 ─────────────────────────────────────────────────
try {
    Update-Index
} catch {
    Write-Status "索引更新失败: $($_.Exception.Message)" "Red"
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
    exit 1
}
