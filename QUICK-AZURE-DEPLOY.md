# 🚀 Quick Azure Deployment Guide

## **Option 1: Automated Script (Recommended)**

### **Step 1: Run the deployment script**
```bash
# Double-click this file:
deploy-to-azure.bat

# Or run in PowerShell:
.\deploy-to-azure.ps1
```

### **Step 2: Add GitHub Secrets**
1. Go to: https://github.com/smartsupplyhealth/website/settings/secrets/actions
2. Click "New repository secret"
3. Add the secrets shown in the script output

### **Step 3: Deploy**
```bash
git add .
git commit -m "Deploy to Azure"
git push
```

---

## **Option 2: Manual Azure Portal (If script fails)**

### **Step 1: Create Resource Group**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Resource group"
3. Name: `SmartSupply-Health-RG`
4. Region: `East US` (or your preferred)

### **Step 2: Create Container Registry**
1. In Resource Group → "Create" → "Container Registry"
2. Name: `smartsupplyregistry` (add random numbers if taken)
3. SKU: `Basic`
4. Enable admin user: `Yes`

### **Step 3: Create Cosmos DB**
1. In Resource Group → "Create" → "Azure Cosmos DB"
2. API: `Azure Cosmos DB for MongoDB`
3. Account name: `smartsupply-cosmos`
4. Capacity mode: `Serverless`

### **Step 4: Create Web App**
1. In Resource Group → "Create" → "Web App"
2. App name: `smartsupply-health-app`
3. Runtime stack: `Docker Container`
4. Operating System: `Linux`
5. Pricing plan: `Free F1`

### **Step 5: Get Credentials**
1. **Container Registry**: Go to Access keys → Copy password
2. **Cosmos DB**: Go to Connection string → Copy primary connection string

### **Step 6: Add GitHub Secrets**
Go to: https://github.com/smartsupplyhealth/website/settings/secrets/actions

Add these secrets:
```
ACR_USERNAME = smartsupplyregistry
ACR_PASSWORD = <your-container-registry-password>
MONGODB_URI = <your-cosmos-db-connection-string>
JWT_SECRET = your-super-secret-jwt-key-here
SENDGRID_API_KEY = your-sendgrid-api-key
STRIPE_SECRET_KEY = your-stripe-secret-key
GOOGLE_AI_API_KEY = your-google-ai-api-key
```

### **Step 7: Deploy**
```bash
git add .
git commit -m "Deploy to Azure"
git push
```

---

## **Check Deployment**

1. **GitHub Actions**: https://github.com/smartsupplyhealth/website/actions
2. **Your App**: `https://smartsupply-health-app.azurewebsites.net`
3. **Health Check**: `https://smartsupply-health-app.azurewebsites.net/health`

---

## **Troubleshooting**

### **If deployment fails:**
1. Check GitHub Actions logs
2. Verify all secrets are added correctly
3. Make sure Azure resources are created
4. Check that app names are unique

### **If app doesn't start:**
1. Check Azure Web App logs
2. Verify environment variables
3. Check Docker image was built successfully

### **Need help?**
- Check the full guide: `AZURE-DEPLOYMENT.md`
- Check GitHub Actions: https://github.com/smartsupplyhealth/website/actions
- Check Azure Portal: https://portal.azure.com
