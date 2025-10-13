Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SmartSupply-Health - Docker Simple" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Arret des conteneurs existants..." -ForegroundColor Yellow
docker-compose down

Write-Host "2. Demarrage des conteneurs..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "3. Attente du demarrage (10 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "4. Verification des conteneurs..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application demarree !" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "  MongoDB:  localhost:27017" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour arreter: docker-compose down" -ForegroundColor Yellow
Write-Host "Pour voir les logs: docker-compose logs -f" -ForegroundColor Yellow















