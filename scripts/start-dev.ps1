# Script para iniciar o servidor de desenvolvimento Dashblue
# Resolve conflitos de porta e cache corrompido

Write-Host "Dashblue - Iniciando servidor..." -ForegroundColor Cyan

# Encerrar processo na porta 3000
$proc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1 OwningProcess -Unique
if ($proc) {
    Write-Host "Encerrando processo na porta 3000 (PID: $($proc.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Limpar cache .next
if (Test-Path ".next") {
    Write-Host "Removendo cache .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Iniciando Next.js em http://localhost:3000" -ForegroundColor Green
npm run dev
