# Azure Container App Deployment Guide

This guide will help you deploy your SmartSupply Health application to Azure Container Apps instead of App Service.

## Prerequisites

1. Azure CLI installed and configured
2. GitHub repository with your code
3. Azure subscription with appropriate permissions

## Step 1: Create Azure Resources

### 1.1 Create Resource Group
```bash
az group create --name smartsupply-rg --location "East US"
```

### 1.2 Create Azure Container Registry
```bash
az acr create --resource-group smartsupply-rg --name smartsupplyacr --sku Basic --admin-enabled true
```

### 1.3 Create Container App Environment
```bash
az containerapp env create --name smartsupply-env --resource-group smartsupply-rg --location "East US"
```

### 1.4 Create Container App
```bash
az containerapp create \
  --name smartsupply-health \
  --resource-group smartsupply-rg \
  --environment smartsupply-env \
  --image smartsupplyacr.azurecr.io/smartsupply-health:latest \
  --target-port 5000 \
  --ingress external \
  --registry-server smartsupplyacr.azurecr.io \
  --registry-username smartsupplyacr \
  --registry-password $(az acr credential show --name smartsupplyacr --query passwords[0].value -o tsv) \
  --env-vars NODE_ENV=production PORT=5000 \
  --secrets mongodb-uri="your-mongodb-connection-string" jwt-secret="your-jwt-secret" \
  --secret-env-vars MONGODB_URI=mongodb-uri JWT_SECRET=jwt-secret
```

## Step 2: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. **AZURE_CREDENTIALS**: Service principal credentials
2. **ACR_USERNAME**: Your ACR username (usually the ACR name)
3. **ACR_PASSWORD**: Your ACR password

### 2.1 Create Service Principal
```bash
az ad sp create-for-rbac --name "smartsupply-github-actions" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/smartsupply-rg --sdk-auth
```

### 2.2 Get ACR Credentials
```bash
az acr credential show --name smartsupplyacr --query passwords[0].value -o tsv
```

## Step 3: Database Configuration

### Option A: Azure Cosmos DB (Recommended)
```bash
az cosmosdb create --name smartsupply-cosmos --resource-group smartsupply-rg --kind MongoDB
```

### Option B: MongoDB Atlas
- Create a MongoDB Atlas cluster
- Get the connection string
- Add it to your Container App secrets

## Step 4: Environment Variables

Configure these environment variables in your Container App:

### Required Variables:
- `NODE_ENV`: production
- `PORT`: 5000
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key

### Optional Variables:
- `STRIPE_SECRET_KEY`: For payment processing
- `SENDGRID_API_KEY`: For email notifications
- `GOOGLE_API_KEY`: For Google services

## Step 5: Deploy

1. Push your code to the main branch
2. GitHub Actions will automatically build and deploy your container
3. Monitor the deployment in the Actions tab

## Step 6: Verify Deployment

1. Check the Container App logs:
```bash
az containerapp logs show --name smartsupply-health --resource-group smartsupply-rg --follow
```

2. Test the health endpoint:
```bash
curl https://your-container-app-url.azurecontainerapps.io/health
```

## Benefits of Container Apps vs App Service

1. **Better Regional Availability**: Container Apps are available in more regions
2. **Cost Efficiency**: Pay only for what you use with auto-scaling
3. **Kubernetes-based**: More flexible and modern architecture
4. **Better Resource Management**: More granular control over CPU and memory
5. **Easier CI/CD**: Better integration with container registries

## Monitoring and Scaling

### Auto-scaling Configuration
The Container App is configured to scale from 1 to 10 replicas based on HTTP traffic (30 concurrent requests per replica).

### Health Checks
- Liveness probe: Checks `/health` endpoint every 10 seconds
- Readiness probe: Checks `/health` endpoint every 5 seconds

### Monitoring
- Use Azure Monitor for application insights
- Set up alerts for critical metrics
- Monitor container logs and performance

## Troubleshooting

### Common Issues:

1. **Container won't start**: Check logs and environment variables
2. **Database connection issues**: Verify MongoDB URI and network access
3. **Image pull failures**: Check ACR credentials and image availability
4. **Health check failures**: Ensure `/health` endpoint is working

### Useful Commands:

```bash
# View logs
az containerapp logs show --name smartsupply-health --resource-group smartsupply-rg

# Update container app
az containerapp update --name smartsupply-health --resource-group smartsupply-rg

# Scale manually
az containerapp update --name smartsupply-health --resource-group smartsupply-rg --min-replicas 2 --max-replicas 5
```

## Security Best Practices

1. Use managed identities when possible
2. Store secrets in Azure Key Vault
3. Enable HTTPS only
4. Use non-root user in containers (already configured)
5. Regular security updates for base images
6. Network policies for container communication

## Cost Optimization

1. Use appropriate CPU and memory limits
2. Configure auto-scaling rules
3. Use spot instances for non-critical workloads
4. Monitor and optimize resource usage
5. Clean up unused resources regularly
