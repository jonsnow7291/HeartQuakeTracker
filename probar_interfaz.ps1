Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  EarthQuakeTracker - Lanzador de Simulador de Interfaz" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Iniciando simulador interactivo en el navegador..." -ForegroundColor Yellow

$htmlPath = Join-Path $PSScriptRoot "preview\index.html"
Start-Process $htmlPath
