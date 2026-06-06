param(
    [Parameter(Mandatory=$true)][string]$SrcDir,
    [Parameter(Mandatory=$true)][string]$DstDir,
    [Parameter(Mandatory=$true)][string[]]$Extensions
)

if (Test-Path $DstDir) { Remove-Item $DstDir -Recurse -Force }
New-Item -ItemType Directory -Path $DstDir -Force | Out-Null

$count = 0
foreach ($ext in $Extensions) {
    $files = Get-ChildItem $SrcDir -Filter $ext -Recurse
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($SrcDir.Length)
        $target = Join-Path $DstDir $rel
        $targetDir = Split-Path $target -Parent
        if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
        try {
            $content = Get-Content $f.FullName -Encoding UTF8 -ErrorAction Stop
            $content | Out-File -FilePath $target -Encoding UTF8 -Force
            $count++
        } catch {
            Write-Host "SKIP: $($f.FullName) - $_"
        }
    }
}
Write-Host "Converted $count files to $DstDir"
