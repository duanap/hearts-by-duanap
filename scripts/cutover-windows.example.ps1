param(
  [string]$Root = "H:\hearts",
  [switch]$Execute
)

$ErrorActionPreference = "Stop"

function Resolve-RequiredPath([string]$PathValue, [string]$Label) {
  if (-not (Test-Path -LiteralPath $PathValue)) {
    throw "$Label does not exist: $PathValue"
  }
  return (Resolve-Path -LiteralPath $PathValue).Path
}

function Invoke-Step([string]$Description, [scriptblock]$Action) {
  Write-Host ""
  Write-Host "==> $Description"
  if ($Execute) {
    & $Action
  } else {
    Write-Host "DRY RUN: not executing. Re-run with -Execute and type CUTOVER when prompted."
  }
}

$RootPath = Resolve-RequiredPath $Root "Root"
$PublicPath = Join-Path $RootPath "public"
$DistPath = Join-Path $RootPath "frontend\dist"
$ScriptsPath = Join-Path $RootPath "scripts"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupPath = Join-Path $RootPath "public_backup_$Timestamp"

$PublicResolved = Resolve-RequiredPath $PublicPath "public"
$DistResolved = Resolve-RequiredPath $DistPath "frontend\dist"

if (-not $PublicResolved.StartsWith($RootPath, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to operate outside root: $PublicResolved"
}
if (-not $DistResolved.StartsWith($RootPath, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to read dist outside root: $DistResolved"
}

Write-Host "Windows cutover example for Svelte frontend"
Write-Host "Root:   $RootPath"
Write-Host "Public: $PublicResolved"
Write-Host "Dist:   $DistResolved"
Write-Host "Backup: $BackupPath"
Write-Host "Mode:   $(if ($Execute) { 'EXECUTE' } else { 'DRY RUN' })"

if ($Execute) {
  $Confirm = Read-Host "Type CUTOVER to replace public from frontend/dist"
  if ($Confirm -ne "CUTOVER") {
    throw "Confirmation failed; no changes were made."
  }
}

Invoke-Step "Run dist integrity check" {
  Push-Location $RootPath
  try {
    node (Join-Path $ScriptsPath "preview-dist-check.mjs")
  } finally {
    Pop-Location
  }
}

Invoke-Step "Backup public to $BackupPath" {
  Copy-Item -LiteralPath $PublicResolved -Destination $BackupPath -Recurse -Force
}

Invoke-Step "Clear public contents" {
  Get-ChildItem -LiteralPath $PublicResolved -Force | Remove-Item -Recurse -Force
}

Invoke-Step "Copy frontend/dist contents to public" {
  Copy-Item -Path (Join-Path $DistResolved "*") -Destination $PublicResolved -Recurse -Force
}

Invoke-Step "Verify required public files" {
  $Required = @(
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "assets",
    "css",
    "icons",
    "table-bg-v1210.webp"
  )
  foreach ($Item in $Required) {
    $PathToCheck = Join-Path $PublicResolved $Item
    if (-not (Test-Path -LiteralPath $PathToCheck)) {
      throw "Missing after copy: public/$Item"
    }
    Write-Host "ok public/$Item"
  }
}

Write-Host ""
Write-Host "Dry-run complete. No files were changed unless -Execute was used."
