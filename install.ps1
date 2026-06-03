# ──────────────────────────────────────────────────
# nice-image — GPT-Image-2 CLI installer (PowerShell)
# One command: git clone ... && powershell -ExecutionPolicy Bypass -File install.ps1
# ──────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

$SkillName = "nice-image"
$SkillDir = "$env:USERPROFILE\.claude\skills\$SkillName"
$CodexDir = "$env:USERPROFILE\.agents\skills\$SkillName"
$OpenClawDir = "$env:USERPROFILE\.openclaw\skills\$SkillName"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   nice-image — GPT-Image-2 CLI Installer" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check prerequisites ──
Write-Host "[1/4] Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = (node -v) -replace '^v', ''
    $nodeMajor = [int]($nodeVersion -split '\.')[0]
} catch {
    Write-Host "Node.js is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://nodejs.org/ (v18 or later)"
    exit 1
}

if ($nodeMajor -lt 18) {
    Write-Host "Node.js v18+ required. Current: v$nodeVersion" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js v$nodeVersion" -ForegroundColor Green

try {
    $npmVersion = npm -v
} catch {
    Write-Host "npm is not installed." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ npm v$npmVersion" -ForegroundColor Green

# ── 2. Install project ──
Write-Host ""
Write-Host "[2/4] Installing nice-image CLI..." -ForegroundColor Yellow

Set-Location $ScriptDir

npm install --silent
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

npm run build --silent
if ($LASTEXITCODE -ne 0) { throw "npm build failed" }

npm install -g . --silent
if ($LASTEXITCODE -ne 0) { throw "global install failed" }

Write-Host "  ✓ nice-image installed globally" -ForegroundColor Green
Write-Host "  ✓ huoke-image subcommands available" -ForegroundColor Green

# ── 3. Install skill files ──
Write-Host ""
Write-Host "[3/4] Installing skill for Claude Code..." -ForegroundColor Yellow

# Claude Code
New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null
Copy-Item "$ScriptDir\SKILL.md" "$SkillDir\SKILL.md" -Force -ErrorAction SilentlyContinue
Copy-Item "$ScriptDir\.claude\settings.json" "$SkillDir\settings.json" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Claude Code: $SkillDir" -ForegroundColor Green

# Codex
New-Item -ItemType Directory -Force -Path $CodexDir | Out-Null
Copy-Item "$ScriptDir\SKILL.md" "$CodexDir\SKILL.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Codex: $CodexDir" -ForegroundColor Green

# OpenClaw
New-Item -ItemType Directory -Force -Path $OpenClawDir | Out-Null
Copy-Item "$ScriptDir\SKILL.md" "$OpenClawDir\SKILL.md" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ OpenClaw: $OpenClawDir" -ForegroundColor Green

# ── 4. Configure API key ──
Write-Host ""
Write-Host "[4/4] Configuring API key..." -ForegroundColor Yellow

$currentKey = [Environment]::GetEnvironmentVariable("NICE_TOKEN_API_KEY", "User")

if ($currentKey) {
    Write-Host "  ✓ NICE_TOKEN_API_KEY already set in User environment" -ForegroundColor Green
} else {
    Write-Host ""
    $apiKey = Read-Host "  Enter your Nice-Token API key"

    if ($apiKey) {
        [Environment]::SetEnvironmentVariable("NICE_TOKEN_API_KEY", $apiKey, "User")
        $env:NICE_TOKEN_API_KEY = $apiKey
        Write-Host "  ✓ Written to User environment variables" -ForegroundColor Green
        Write-Host "  (Restart your terminal for it to take effect in new sessions)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ⚠ Skipped. Set manually:" -ForegroundColor Yellow
        Write-Host '    [Environment]::SetEnvironmentVariable("NICE_TOKEN_API_KEY", "sk-...", "User")' -ForegroundColor DarkGray
    }
}

# ── 5. Optional smoke test ──
Write-Host ""
Write-Host "──────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  Install complete!" -ForegroundColor Green
Write-Host ""

$runTest = Read-Host "  Run a smoke test? (Generates a test image, ~10 seconds) [Y/n]"

if ($runTest -ne "n" -and $runTest -ne "N") {
    Write-Host ""
    Write-Host "  Running smoke test..." -ForegroundColor Cyan

    if (-not $env:NICE_TOKEN_API_KEY) {
        Write-Host "  ✗ NICE_TOKEN_API_KEY not set. Skipping smoke test." -ForegroundColor Red
    } else {
        try {
            nice-image -u "https://picsum.photos/512/512" `
                -p "A simple product on a clean white background, studio lighting" 2>&1
        } catch {
            # Ignore errors from smoke test
        }
        Write-Host ""
        Write-Host "  ✓ Smoke test complete." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   Done! Next time Claude Code starts," -ForegroundColor Green
Write-Host "   it will auto-discover the skill." -ForegroundColor Green
Write-Host ""

Write-Host "  Test manually:" -ForegroundColor DarkGray
Write-Host '  nice-image -u "https://example.com/img.jpg" -p "test prompt"' -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
