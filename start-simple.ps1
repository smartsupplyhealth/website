Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SmartSupply-Health - Configuration Simple" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Demarrage de MongoDB..." -ForegroundColor Yellow
Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Normal

Write-Host "2. Attente de MongoDB (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "3. Demarrage du Backend (Port 5000)..." -ForegroundColor Yellow
Set-Location backend
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal

Write-Host "4. Attente du Backend (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "5. Demarrage du Frontend (Port 3000)..." -ForegroundColor Yellow
Set-Location ../frontend
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application demarree !" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green















