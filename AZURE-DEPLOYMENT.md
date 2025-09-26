# 🚀 SmartSupply Health - Azure Deployment Guide

This guide will help you deploy your SmartSupply-Health project to Microsoft Azure.

## 📋 **Prerequisites**

### **1. Azure Account**
- [Create Azure Account](https://azure.microsoft.com/en-us/free/)
- [Azure CLI installed](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)

### **2. Required Azure Services**
- **Azure Container Registry (ACR)**
- **Azure Web App for Containers**
- **Azure Cosmos DB (MongoDB API)**
- **Application Insights**

## 🛠️ **Step 1: Create Azure Resources**

### **Option A: Using Azure Portal (Recommended for beginners)**

1. **Create Resource Group**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create new Resource Group: `SmartSupply-Health-RG`
   - Choose your preferred region

2. **Create Container Registry**
   - Search for "Container Registry"
   - Create new: `smartsupplyregistry`
   - Enable admin user
   - Note the login server URL

3. **Create Cosmos DB**
   - Search for "Azure Cosmos DB"
   - Create new with MongoDB API
   - Note the connection string

4. **Create Web App**
   - Search for "App Service"
   - Create new Web App
   - Choose "Docker Container" as deployment source
   - Select your Container Registry

### **Option B: Using Azure CLI**

```bash
# Login to Azure
az login

# Create Resource Group
az group create --name SmartSupply-Health-RG --location eastus

# Create Container Registry
az acr create --resource-group SmartSupply-Health-RG --name smartsupplyregistry --sku Basic --admin-enabled true

# Create Cosmos DB
az cosmosdb create --resource-group SmartSupply-Health-RG --name smartsupply-cosmos --kind MongoDB

# Create App Service Plan
az appservice plan create --resource-group SmartSupply-Health-RG --name smartsupply-plan --sku B1 --is-linux

# Create Web App
az webapp create --resource-group SmartSupply-Health-RG --plan smartsupply-plan --name smartsupply-health-app --deployment-container-image-name smartsupplyregistry.azurecr.io/smartsupply-health:latest
```

## 🔧 **Step 2: Configure GitHub Secrets**

Add these secrets to your GitHub repository:

1. **Go to GitHub Repository Settings**
2. **Navigate to Secrets and Variables > Actions**
3. **Add the following secrets:**

```
ACR_USERNAME=smartsupplyregistry
ACR_PASSWORD=<your-acr-password>
MONGODB_URI=<your-cosmos-db-connection-string>
JWT_SECRET=<your-jwt-secret>
SENDGRID_API_KEY=<your-sendgrid-key>
STRIPE_SECRET_KEY=<your-stripe-secret>
GOOGLE_AI_API_KEY=<your-google-ai-key>
```

## 🚀 **Step 3: Deploy to Azure**

### **Automatic Deployment (Recommended)**
1. **Push code to main branch**
2. **GitHub Actions will automatically:**
   - Build Docker image
   - Push to Azure Container Registry
   - Deploy to Azure Web App
   - Configure app settings

### **Manual Deployment**
```bash
# Build and push to Azure Container Registry
az acr build --registry smartsupplyregistry --image smartsupply-health:latest .

# Deploy to Web App
az webapp config container set --name smartsupply-health-app --resource-group SmartSupply-Health-RG --docker-custom-image-name smartsupplyregistry.azurecr.io/smartsupply-health:latest
```

## 🌐 **Step 4: Access Your Application**

### **Your App URLs:**
- **Main Application**: `https://smartsupply-health-app.azurewebsites.net`
- **Health Check**: `https://smartsupply-health-app.azurewebsites.net/health`
- **API Documentation**: `https://smartsupply-health-app.azurewebsites.net/api`

## 📊 **Step 5: Monitor Your Application**

### **Azure Portal Monitoring:**
1. **Go to your Web App in Azure Portal**
2. **Check "Logs" for application logs**
3. **Check "Metrics" for performance data**
4. **Check "Application Insights" for detailed analytics**

### **Health Check:**
```bash
curl https://smartsupply-health-app.azurewebsites.net/health
```

## 🔄 **Step 6: CI/CD Pipeline**

### **What Happens Automatically:**
1. **Code Push** → Triggers GitHub Actions
2. **Build** → Creates Docker image
3. **Push** → Uploads to Azure Container Registry
4. **Deploy** → Updates Azure Web App
5. **Configure** → Sets environment variables
6. **Restart** → Restarts the application

### **Pipeline Status:**
- **Check**: https://github.com/smartsupplyhealth/website/actions
- **Green checkmark** ✅ = Success
- **Red X** ❌ = Failed (check logs)

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Container Won't Start**
   ```bash
   # Check logs
   az webapp log tail --name smartsupply-health-app --resource-group SmartSupply-Health-RG
   ```

2. **Database Connection Issues**
   - Verify Cosmos DB connection string
   - Check firewall rules
   - Ensure MongoDB API is enabled

3. **Environment Variables Not Set**
   - Check GitHub Secrets are configured
   - Verify Azure Web App app settings
   - Restart the application

4. **Build Failures**
   - Check Docker build logs
   - Verify all dependencies are installed
   - Check for Node.js version compatibility

### **Useful Commands:**
```bash
# Check Web App status
az webapp show --name smartsupply-health-app --resource-group SmartSupply-Health-RG

# View logs
az webapp log tail --name smartsupply-health-app --resource-group SmartSupply-Health-RG

# Restart app
az webapp restart --name smartsupply-health-app --resource-group SmartSupply-Health-RG

# Update app settings
az webapp config appsettings set --name smartsupply-health-app --resource-group SmartSupply-Health-RG --settings NODE_ENV=production
```

## 💰 **Cost Optimization**

### **Free Tier Options:**
- **App Service**: F1 (Free) tier available
- **Cosmos DB**: Free tier (400 RU/s)
- **Container Registry**: Basic tier
- **Application Insights**: Free tier

### **Scaling:**
- **Auto-scale** based on CPU usage
- **Manual scaling** through Azure Portal
- **Cost alerts** to monitor spending

## 🔒 **Security Best Practices**

1. **Use Azure Key Vault** for sensitive data
2. **Enable HTTPS** (automatic with Azure)
3. **Configure CORS** properly
4. **Use managed identities** when possible
5. **Regular security updates**

## 📈 **Performance Optimization**

1. **Enable CDN** for static assets
2. **Use Application Insights** for monitoring
3. **Configure auto-scaling**
4. **Optimize Docker image size**
5. **Use Azure Cache for Redis**

## 🎯 **Next Steps**

1. **Set up custom domain** (optional)
2. **Configure SSL certificate** (automatic)
3. **Set up monitoring alerts**
4. **Configure backup strategy**
5. **Set up staging environment**

---

**🎉 Congratulations! Your SmartSupply-Health app is now running on Azure!**

**Your app is live at**: `https://smartsupply-health-app.azurewebsites.net`
