# 🚀 Migration Guide: App Service → Container Apps

This guide will help you migrate from Azure App Service to Azure Container Apps for better regional availability and fewer restrictions.

## 🎯 **Why Migrate to Container Apps?**

### **Benefits of Container Apps over App Service:**
- ✅ **Better Regional Availability** - Available in more regions worldwide
- ✅ **Fewer Region Restrictions** - More deployment options
- ✅ **Modern Architecture** - Kubernetes-based, more flexible
- ✅ **Better Resource Management** - Granular CPU/memory control
- ✅ **Cost Efficiency** - Pay only for what you use with auto-scaling
- ✅ **Easier CI/CD** - Better container registry integration

## 📊 **Current vs New Architecture**

| Component | App Service (Old) | Container Apps (New) |
|-----------|------------------|---------------------|
| **Deployment** | `azure-deploy.yml` | `preprod-pipeline.yml` + `prod-pipeline.yml` |
| **Registry** | `smartsupplyregistry.azurecr.io` | `smartsupplyregistry.azurecr.io` (same) |
| **Resource Group** | `SmartSupply-Health-RG` | `SmartSupply-Health-RG` (same) |
| **App Name** | `smartsupply-health-app` | `smartsupply-health-prod` |
| **Environment** | Single production | Preprod + Production |
| **Scaling** | Manual/auto | Auto-scaling with rules |
| **Resources** | Fixed plan | Dynamic allocation |

## 🔄 **Migration Steps**

### **Step 1: Verify Current Setup**
```bash
# Check your current App Service
az webapp list --resource-group SmartSupply-Health-RG --output table

# Check your Container Registry
az acr list --resource-group SmartSupply-Health-RG --output table
```

### **Step 2: Create Container App Environment**
```bash
# Create Container App Environment
az containerapp env create \
  --name smartsupply-env \
  --resource-group SmartSupply-Health-RG \
  --location "East US"
```

### **Step 3: Deploy to Pre-Production**
```bash
# Deploy to test environment first
git checkout test
git push origin test
# This triggers the preprod-pipeline.yml
```

### **Step 4: Test Pre-Production**
- **URL**: `https://smartsupply-health-preprod.azurecontainerapps.io`
- **Health Check**: `https://smartsupply-health-preprod.azurecontainerapps.io/health`
- **Resources**: 1 CPU, 2Gi Memory, 1-5 replicas

### **Step 5: Deploy to Production**
```bash
# When ready, merge to main
git checkout main
git merge test
git push origin main
# This triggers the prod-pipeline.yml
```

### **Step 6: Verify Production**
- **URL**: `https://smartsupply-health-prod.azurecontainerapps.io`
- **Health Check**: `https://smartsupply-health-prod.azurecontainerapps.io/health`
- **Resources**: 2 CPU, 4Gi Memory, 2-20 replicas

## 🔧 **Environment Variables Migration**

### **App Service → Container Apps Mapping**

| App Service Setting | Container App Secret | Description |
|---------------------|---------------------|-------------|
| `MONGODB_URI` | `mongodb-uri` | Database connection string |
| `JWT_SECRET` | `jwt-secret` | JWT signing secret |
| `SENDGRID_API_KEY` | `sendgrid-api-key` | Email service API key |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | Payment processing key |
| `GOOGLE_AI_API_KEY` | `google-api-key` | Google AI API key |

### **Setting Up Secrets in Container Apps**
```bash
# Add secrets to Container App
az containerapp secret set \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --secrets \
    mongodb-uri="your-mongodb-connection-string" \
    jwt-secret="your-jwt-secret" \
    stripe-secret-key="your-stripe-secret" \
    sendgrid-api-key="your-sendgrid-key" \
    google-api-key="your-google-key"
```

## 📋 **GitHub Secrets Required**

Update your GitHub repository secrets:

### **Existing Secrets (Keep These):**
- `AZURE_CREDENTIALS` - Service principal credentials
- `ACR_USERNAME` - Container registry username
- `ACR_PASSWORD` - Container registry password
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `SENDGRID_API_KEY` - Email service API key
- `STRIPE_SECRET_KEY` - Payment processing key
- `GOOGLE_AI_API_KEY` - Google AI API key

### **New Secrets (Add These):**
- `VERCEL_TOKEN` - For frontend deployment (if using Vercel)
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Frontend project ID
- `VERCEL_BACKEND_PROJECT_ID` - Backend project ID

## 🚨 **Migration Checklist**

### **Pre-Migration:**
- [ ] Backup current App Service configuration
- [ ] Document current environment variables
- [ ] Test application locally with Docker
- [ ] Verify Container Registry access

### **During Migration:**
- [ ] Create Container App Environment
- [ ] Deploy to pre-production first
- [ ] Test all functionality in pre-production
- [ ] Verify health checks work
- [ ] Test scaling behavior

### **Post-Migration:**
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Update DNS/domain settings if needed
- [ ] Monitor performance and logs
- [ ] Decommission old App Service (optional)

## 🔍 **Monitoring and Troubleshooting**

### **View Container App Logs**
```bash
# Pre-production logs
az containerapp logs show \
  --name smartsupply-health-preprod \
  --resource-group SmartSupply-Health-RG \
  --follow

# Production logs
az containerapp logs show \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --follow
```

### **Check Container App Status**
```bash
# List all Container Apps
az containerapp list --resource-group SmartSupply-Health-RG --output table

# Get specific Container App details
az containerapp show \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG
```

### **Common Issues and Solutions**

1. **Container Won't Start**
   - Check logs for error messages
   - Verify environment variables are set
   - Check resource limits

2. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check network connectivity
   - Ensure database is accessible

3. **Health Check Failures**
   - Verify `/health` endpoint is working
   - Check application startup time
   - Review health check configuration

## 💰 **Cost Comparison**

### **App Service (Old)**
- Fixed pricing based on plan
- Always running (even when idle)
- Limited scaling options

### **Container Apps (New)**
- Pay-per-use model
- Auto-scaling to zero when idle
- More granular resource control
- Better cost optimization

## 🎯 **Next Steps After Migration**

1. **Monitor Performance** - Use Azure Monitor and Application Insights
2. **Set Up Alerts** - Configure alerts for critical metrics
3. **Optimize Resources** - Adjust CPU/memory based on usage
4. **Implement Backup** - Set up database and configuration backups
5. **Security Review** - Review and update security configurations

## 🔄 **Rollback Plan**

If you need to rollback to App Service:

1. **Keep App Service Running** - Don't delete it immediately
2. **Update DNS** - Point back to App Service URL
3. **Revert Code** - Use the old `azure-deploy.yml` workflow
4. **Monitor** - Ensure everything works correctly

## 📞 **Support and Resources**

- **Azure Container Apps Documentation**: https://docs.microsoft.com/en-us/azure/container-apps/
- **Migration Guide**: https://docs.microsoft.com/en-us/azure/container-apps/migrate-from-app-service
- **GitHub Actions**: https://docs.github.com/en/actions
- **Container Registry**: https://docs.microsoft.com/en-us/azure/container-registry/

---

**🎉 Congratulations! You're now ready to migrate from App Service to Container Apps with better regional availability and fewer restrictions!**
