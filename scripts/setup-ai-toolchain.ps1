# setup-ai-toolchain.ps1
# Script de verificacao e ativacao da Toolchain de IA (superpowers, mattpocock/skills, ECC)
param(
    [switch]$InstallPlugins
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Menu Digital - Verificacao da Toolchain de Agentes IA" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$expectedSkills = @(
    "subagent-driven-development",
    "writing-plans",
    "test-driven-development",
    "systematic-debugging",
    "verification-before-completion",
    "finishing-a-development-branch",
    "grill-with-docs",
    "domain-modeling-matt",
    "code-review-matt",
    "wayfinder-matt",
    "tdd-workflow-ecc",
    "security-review-ecc",
    "backend-patterns-ecc",
    "frontend-patterns-ecc",
    "verify-monorepo"
)

$missingSkills = @()
$skillsPath = Join-Path $PSScriptRoot "..\\.agents\\skills"

foreach ($skill in $expectedSkills) {
    $skillDir = Join-Path $skillsPath $skill
    $skillFile = Join-Path $skillDir "SKILL.md"
    if (Test-Path $skillFile) {
        Write-Host "  [OK] Skill: $skill" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Skill ausente: $skill" -ForegroundColor Red
        $missingSkills += $skill
    }
}

if ($missingSkills.Count -gt 0) {
    Write-Host ""
    Write-Host "Erro: Existem $($missingSkills.Count) skills ausentes no repositorio!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Todas as 15 skills dos 3 repositorios oficiais estao presentes e ativas!" -ForegroundColor Green

if ($InstallPlugins) {
    if (Get-Command agy -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "Instalando plugin oficial do Superpowers no Antigravity CLI..." -ForegroundColor Yellow
        agy plugin install https://github.com/obra/superpowers
    } else {
        Write-Host ""
        Write-Host "Antigravity CLI (agy) nao detectado no PATH global. As skills continuam 100% operacionais via .agents/skills/." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Toolchain pronta para uso de IA em qualquer ambiente clonado." -ForegroundColor Cyan
Write-Host ""
