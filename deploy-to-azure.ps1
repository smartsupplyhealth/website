# SmartSupply Health - Azure Deployment Script
# This script will help you deploy your project to Azure

Write-Host "🚀 SmartSupply Health - Azure Deployment Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if Azure CLI is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    $azVersion = az --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Azure CLI is not installed" -ForegroundColor Red
        Write-Host "Please install Azure CLI first:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Cyan
        Write-Host "2. Or run: winget install Microsoft.AzureCLI" -ForegroundColor Cyan
        Write-Host "3. Restart your terminal after installation" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "❌ Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Azure CLI first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Cyan
    Write-Host "2. Or run: winget install Microsoft.AzureCLI" -ForegroundColor Cyan
    Write-Host "3. Restart your terminal after installation" -ForegroundColor Cyan
    exit 1
}

# Login to Azure
Write-Host ""
Write-Host "🔐 Logging into Azure..." -ForegroundColor Yellow
az login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Azure" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully logged into Azure" -ForegroundColor Green

# Get subscription info
Write-Host ""
Write-Host "📊 Getting Azure subscription information..." -ForegroundColor Yellow
$subscription = az account show --query "name" -o tsv
Write-Host "Current subscription: $subscription" -ForegroundColor Cyan

# Set variables
$resourceGroupName = "SmartSupply-Health-RG"
$location = "eastus"
$acrName = "smartsupplyregistry$(Get-Random -Maximum 9999)"
$cosmosName = "smartsupply-cosmos-$(Get-Random -Maximum 9999)"
$appServicePlanName = "smartsupply-plan"
$webAppName = "smartsupply-health-app-$(Get-Random -Maximum 9999)"

Write-Host ""
Write-Host "🏗️ Creating Azure resources..." -ForegroundColor Yellow
Write-Host "Resource Group: $resourceGroupName" -ForegroundColor Cyan
Write-Host "Container Registry: $acrName" -ForegroundColor Cyan
Write-Host "Cosmos DB: $cosmosName" -ForegroundColor Cyan
Write-Host "Web App: $webAppName" -ForegroundColor Cyan

# Create Resource Group
Write-Host ""
Write-Host "📦 Creating Resource Group..." -ForegroundColor Yellow
az group create --name $resourceGroupName --location $location

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Resource Group" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Resource Group created successfully" -ForegroundColor Green

# Create Container Registry
Write-Host ""
Write-Host "🐳 Creating Container Registry..." -ForegroundColor Yellow
az acr create --resource-group $resourceGroupName --name $acrName --sku Basic --admin-enabled true

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Container Registry" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container Registry created successfully" -ForegroundColor Green

# Create Cosmos DB
Write-Host ""
Write-Host "🗄️ Creating Cosmos DB..." -ForegroundColor Yellow
az cosmosdb create --resource-group $resourceGroupName --name $cosmosName --kind MongoDB --locations regionName=$location

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Cosmos DB" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cosmos DB created successfully" -ForegroundColor Green

# Create App Service Plan
Write-Host ""
Write-Host "📋 Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --resource-group $resourceGroupName --name $appServicePlanName --sku F1 --is-linux

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create App Service Plan" -ForegroundColor Red
    exit 1
}

Write-Host "✅ App Service Plan created successfully" -ForegroundColor Green

# Create Web App
Write-Host ""
Write-Host "🌐 Creating Web App..." -ForegroundColor Yellow
az webapp create --resource-group $resourceGroupName --plan $appServicePlanName --name $webAppName --deployment-container-image-name "$acrName.azurecr.io/smartsupply-health:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create Web App" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Web App created successfully" -ForegroundColor Green

# Get credentials
Write-Host ""
Write-Host "🔑 Getting Azure credentials..." -ForegroundColor Yellow

# Get ACR credentials
$acrUsername = az acr credential show --name $acrName --query "username" -o tsv
$acrPassword = az acr credential show --name $acrName --query "passwords[0].value" -o tsv

# Get Cosmos DB connection string
$cosmosConnectionString = az cosmosdb keys list --name $cosmosName --resource-group $resourceGroupName --type connection-strings --query "connectionStrings[0].connectionString" -o tsv

Write-Host ""
Write-Host "🎉 Azure resources created successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add these secrets to your GitHub repository:" -ForegroundColor Cyan
Write-Host "   Go to: https://github.com/smartsupplyhealth/website/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ACR_USERNAME = $acrUsername" -ForegroundColor White
Write-Host "   ACR_PASSWORD = $acrPassword" -ForegroundColor White
Write-Host "   MONGODB_URI = $cosmosConnectionString" -ForegroundColor White
Write-Host "   JWT_SECRET = your-super-secret-jwt-key-here" -ForegroundColor White
Write-Host "   SENDGRID_API_KEY = your-sendgrid-api-key" -ForegroundColor White
Write-Host "   STRIPE_SECRET_KEY = your-stripe-secret-key" -ForegroundColor White
Write-Host "   GOOGLE_AI_API_KEY = your-google-ai-api-key" -ForegroundColor White
Write-Host ""
Write-Host "2. Push any change to trigger deployment:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Trigger Azure deployment'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""
Write-Host "3. Check deployment status:" -ForegroundColor Cyan
Write-Host "   GitHub Actions: https://github.com/smartsupplyhealth/website/actions" -ForegroundColor White
Write-Host "   Your App: https://$webAppName.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Azure Portal: https://portal.azure.com" -ForegroundColor Cyan
Write-Host "📊 Resource Group: $resourceGroupName" -ForegroundColor Cyan
Write-Host "🐳 Container Registry: $acrName" -ForegroundColor Cyan
Write-Host "🗄️ Cosmos DB: $cosmosName" -ForegroundColor Cyan
Write-Host "🌐 Web App: $webAppName" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deployment setup complete!" -ForegroundColor Green
