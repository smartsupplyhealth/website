Write-Host "🚀 Starting SmartSupply Health Auto-Deploy..." -ForegroundColor Green
Write-Host ""
Write-Host "This will automatically commit and push changes when you save files." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm install
}

# Start the auto-deploy watcher
Write-Host "👀 Starting file watcher..." -ForegroundColor Blue
npm run auto-deploy
