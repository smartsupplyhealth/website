#!/bin/bash

# Azure Container App Deployment Script
# This script helps deploy the SmartSupply Health application to Azure Container Apps

set -e

# Configuration
RESOURCE_GROUP="SmartSupply-Health-RG"
ACR_NAME="smartsupplyregistry"
CONTAINER_APP_NAME="smartsupply-health"
ENVIRONMENT_NAME="smartsupply-env"
LOCATION="East US"
TEST_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            TEST_MODE=true
            CONTAINER_APP_NAME="smartsupply-health-test"
            ENVIRONMENT_NAME="smartsupply-env-test"
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Azure Container App deployment...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI is installed and authenticated${NC}"

# Create resource group if it doesn't exist
echo -e "${YELLOW}📦 Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

# Create Azure Container Registry if it doesn't exist
echo -e "${YELLOW}📦 Creating Azure Container Registry...${NC}"
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true --output table

# Create Container App Environment if it doesn't exist
echo -e "${YELLOW}📦 Creating Container App Environment...${NC}"
az containerapp env create --name $ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP --location "$LOCATION" --output table

# Build and push Docker image
echo -e "${YELLOW}🐳 Building and pushing Docker image...${NC}"
az acr build --registry $ACR_NAME --image smartsupply-health:latest .

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Create or update Container App
echo -e "${YELLOW}🚀 Creating/updating Container App...${NC}"
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/smartsupply-health:latest \
  --target-port 5000 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars NODE_ENV=production PORT=5000 \
  --secrets mongodb-uri="your-mongodb-connection-string" jwt-secret="your-jwt-secret" stripe-secret="your-stripe-secret" \
  --secret-env-vars MONGODB_URI=mongodb-uri JWT_SECRET=jwt-secret STRIPE_SECRET_KEY=stripe-secret \
  --cpu 1.0 \
  --memory 2Gi \
  --min-replicas 1 \
  --max-replicas 10 \
  --output table

# Get the Container App URL
APP_URL=$(az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is available at: https://$APP_URL${NC}"
echo -e "${GREEN}🔍 Health check: https://$APP_URL/health${NC}"

# Display useful commands
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "View logs: az containerapp logs show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo "Update app: az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP"
echo "Scale app: az containerapp update --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --min-replicas 2 --max-replicas 5"
