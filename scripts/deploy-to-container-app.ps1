# Azure Container App Deployment Script (PowerShell)
# This script helps deploy the SmartSupply Health application to Azure Container Apps

param(
    [string]$ResourceGroup = "SmartSupply-Health-RG",
    [string]$ACRName = "smartsupplyregistry",
    [string]$ContainerAppName = "smartsupply-health",
    [string]$EnvironmentName = "smartsupply-env",
    [string]$Location = "East US",
    [switch]$Test = $false
)

# If test flag is set, use test naming
if ($Test) {
    $ContainerAppName = "smartsupply-health-test"
    $EnvironmentName = "smartsupply-env-test"
}

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$NC = "`e[0m" # No Color

Write-Host "${Green}🚀 Starting Azure Container App deployment...${NC}"

# Check if Azure CLI is installed
try {
    az version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI not found"
    }
} catch {
    Write-Host "${Red}❌ Azure CLI is not installed. Please install it first.${NC}"
    exit 1
}

# Check if logged in to Azure
try {
    az account show | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
} catch {
    Write-Host "${Yellow}⚠️  Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
}

Write-Host "${Green}✅ Azure CLI is installed and authenticated${NC}"

# Create resource group if it doesn't exist
Write-Host "${Yellow}📦 Creating resource group...${NC}"
az group create --name $ResourceGroup --location $Location --output table

# Create Azure Container Registry if it doesn't exist
Write-Host "${Yellow}📦 Creating Azure Container Registry...${NC}"
az acr create --resource-group $ResourceGroup --name $ACRName --sku Basic --admin-enabled true --output table

# Create Container App Environment if it doesn't exist
Write-Host "${Yellow}📦 Creating Container App Environment...${NC}"
az containerapp env create --name $EnvironmentName --resource-group $ResourceGroup --location $Location --output table

# Build and push Docker image
Write-Host "${Yellow}🐳 Building and pushing Docker image...${NC}"
az acr build --registry $ACRName --image smartsupply-health:latest .

# Get ACR credentials
$ACRUsername = az acr credential show --name $ACRName --query username -o tsv
$ACRPassword = az acr credential show --name $ACRName --query passwords[0].value -o tsv

# Create or update Container App
Write-Host "${Yellow}🚀 Creating/updating Container App...${NC}"
az containerapp create `
  --name $ContainerAppName `
  --resource-group $ResourceGroup `
  --environment $EnvironmentName `
  --image "$ACRName.azurecr.io/smartsupply-health:latest" `
  --target-port 5000 `
  --ingress external `
  --registry-server "$ACRName.azurecr.io" `
  --registry-username $ACRUsername `
  --registry-password $ACRPassword `
  --env-vars NODE_ENV=production PORT=5000 `
  --secrets mongodb-uri="your-mongodb-connection-string" jwt-secret="your-jwt-secret" stripe-secret="your-stripe-secret" `
  --secret-env-vars MONGODB_URI=mongodb-uri JWT_SECRET=jwt-secret STRIPE_SECRET_KEY=stripe-secret `
  --cpu 1.0 `
  --memory 2Gi `
  --min-replicas 1 `
  --max-replicas 10 `
  --output table

# Get the Container App URL
$AppUrl = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv

Write-Host "${Green}✅ Deployment completed successfully!${NC}"
Write-Host "${Green}🌐 Your application is available at: https://$AppUrl${NC}"
Write-Host "${Green}🔍 Health check: https://$AppUrl/health${NC}"

# Display useful commands
Write-Host "${Yellow}📋 Useful commands:${NC}"
Write-Host "View logs: az containerapp logs show --name $ContainerAppName --resource-group $ResourceGroup --follow"
Write-Host "Update app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup"
Write-Host "Scale app: az containerapp update --name $ContainerAppName --resource-group $ResourceGroup --min-replicas 2 --max-replicas 5"
