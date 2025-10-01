# Build and prepare frontend for Static Web App deployment
Write-Host "🔨 Building frontend for Static Web App deployment..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location frontend

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (Test-Path "build") {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📁 Build files are in the 'build' directory" -ForegroundColor Cyan
    
    # Show build directory contents
    Write-Host "📋 Build directory contents:" -ForegroundColor Yellow
    Get-ChildItem -Path "build" -Recurse | Select-Object Name, Length, LastWriteTime | Format-Table
    
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Azure Portal (https://portal.azure.com)" -ForegroundColor White
    Write-Host "2. Create a new Static Web App" -ForegroundColor White
    Write-Host "3. Choose 'Other' as source" -ForegroundColor White
    Write-Host "4. Upload the contents of the 'build' folder" -ForegroundColor White
    Write-Host "5. Or use the Azure CLI script: .\deploy-static-web-app.ps1" -ForegroundColor White
    
} else {
    Write-Host "❌ Build failed! Check the error messages above." -ForegroundColor Red
}

# Go back to root directory
Set-Location ..
