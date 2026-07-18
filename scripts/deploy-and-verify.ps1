param(
    [string]$CommitMessage = "Update AGOS project",
    [string]$Branch = "main",
    [switch]$SkipGit,
    [switch]$SkipRender
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[1/4] Refreshing public folder..." -ForegroundColor Cyan
$newDirs = @('main', 'module_1', 'module_2', 'module_3', 'module_4')

foreach ($dir in $newDirs) {
    $source = Join-Path $root $dir
    $target = Join-Path $root "public/$dir"
    if (Test-Path $source) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
    }
}

$rootFiles = @('water-level-control.html')
foreach ($file in $rootFiles) {
    $source = Join-Path $root $file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination (Join-Path $root "public/$file") -Force
    }
}

if (Test-Path (Join-Path $root 'scripts/generate-runtime-config.js')) {
    Write-Host "[2/4] Generating runtime config..." -ForegroundColor Cyan
    node (Join-Path $root 'scripts/generate-runtime-config.js') | Out-Null
}

Write-Host "[3/4] Verifying project files..." -ForegroundColor Cyan
$requiredItems = @(
    'server.js',
    'package.json',
    'public/main/main.html',
    'public/module_1/index.html',
    'public/module_4/module4.html',
    'public/water-level-control.html'
)

foreach ($item in $requiredItems) {
    $fullPath = Join-Path $root $item
    if (Test-Path $fullPath) {
        Write-Host "  [OK] $item" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $item" -ForegroundColor Yellow
    }
}

if (-not $SkipGit) {
    Write-Host "[4/4] Preparing GitHub update..." -ForegroundColor Cyan
    git status --short
    git add .

    $status = git status --short
    if ($status) {
        git commit -m $CommitMessage
        git push origin $Branch
    } else {
        Write-Host "No file changes to commit." -ForegroundColor DarkYellow
    }
}

if (-not $SkipRender) {
    if ($env:RENDER_API_KEY -and $env:RENDER_SERVICE_ID) {
        Write-Host "Triggering Render deploy..." -ForegroundColor Cyan
        $headers = @{ Authorization = "Bearer $env:RENDER_API_KEY" }
        Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$env:RENDER_SERVICE_ID/deploys" -Headers $headers | Out-Null
        Write-Host "Render deployment request sent." -ForegroundColor Green
    } else {
        Write-Host "Render deployment skipped. Set RENDER_API_KEY and RENDER_SERVICE_ID to auto-deploy." -ForegroundColor Yellow
    }
}

Write-Host "Deployment and verification complete." -ForegroundColor Green
