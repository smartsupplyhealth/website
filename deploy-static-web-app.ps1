# Deploy Frontend as Static Web App using Azure CLI
Write-Host "🚀 Deploying Frontend as Static Web App..." -ForegroundColor Green

# Set variables - UPDATE THESE VALUES
$RESOURCE_GROUP = "smartsupply-rg"  # Replace with your actual resource group
$STATIC_WEB_APP_NAME = "smartsupply-frontend"
$LOCATION = "West Europe"  # Replace with your preferred region
$REPO_URL = "https://github.com/smartsupplyhealth/website"
$BRANCH = "main"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Static Web App Name: $STATIC_WEB_APP_NAME"
Write-Host "  Location: $LOCATION"
Write-Host "  Repository: $REPO_URL"
Write-Host "  Branch: $BRANCH"
Write-Host ""

# Check if Azure CLI is installed
Write-Host "🔍 Checking Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI first." -ForegroundColor Red
    Write-Host "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Cyan
    exit 1
}

# Check if logged in to Azure
Write-Host "🔍 Checking Azure login status..." -ForegroundColor Yellow
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "   Subscription: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    Write-Host "Running 'az login'..." -ForegroundColor Yellow
    az login
}

# Check if resource group exists
Write-Host "🔍 Checking resource group..." -ForegroundColor Yellow
try {
    $rg = az group show --name $RESOURCE_GROUP --output json | ConvertFrom-Json
    Write-Host "✅ Resource group found: $($rg.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Resource group '$RESOURCE_GROUP' not found." -ForegroundColor Red
    Write-Host "Creating resource group..." -ForegroundColor Yellow
    az group create --name $RESOURCE_GROUP --location $LOCATION
}

# Create Static Web App
Write-Host "🏗️ Creating Static Web App..." -ForegroundColor Yellow
try {
    $staticWebApp = az staticwebapp create `
        --name $STATIC_WEB_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --source $REPO_URL `
        --location $LOCATION `
        --branch $BRANCH `
        --app-location "/frontend" `
        --output-location "build" `
        --output json | ConvertFrom-Json
    
    Write-Host "✅ Static Web App created successfully!" -ForegroundColor Green
    Write-Host "   Name: $($staticWebApp.name)" -ForegroundColor Green
    Write-Host "   URL: $($staticWebApp.defaultHostname)" -ForegroundColor Green
    Write-Host "   Resource Group: $($staticWebApp.resourceGroup)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🌐 Your Static Web App is available at:" -ForegroundColor Cyan
    Write-Host "   https://$($staticWebApp.defaultHostname)" -ForegroundColor White
    Write-Host "   Login: https://$($staticWebApp.defaultHostname)/login" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error creating Static Web App: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "The Static Web App will automatically deploy from your GitHub repository." -ForegroundColor Yellow
Write-Host "Any changes pushed to the 'main' branch will trigger a new deployment." -ForegroundColor Yellow
