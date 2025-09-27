# 🚀 Quick Fix Guide: Restore Your Backend

## 🚨 **Current Issue**
Your App Service backend (`ssh-backend-220371.azurewebsites.net`) is returning 503 errors, likely due to missing MongoDB connection.

## 🔧 **Solution: Fix App Service Backend**

### **Method 1: Azure Portal (Recommended)**

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to your App Service**:
   - Search for: `ssh-backend-220371`
   - Or go to: Resource Groups → `rg-smarthealth` → `ssh-backend-220371`

3. **Go to Configuration**:
   - Click on "Configuration" in the left menu
   - Click on "Application settings" tab

4. **Add/Update these settings**:
   ```
   MONGODB_URI = mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority&appName=smartsupply-db
   NODE_ENV = production
   PORT = 5000
   ```

5. **Save and Restart**:
   - Click "Save"
   - Go to "Overview" → Click "Restart"

### **Method 2: Azure CLI (Alternative)**

```bash
# Set MongoDB URI
az webapp config appsettings set --resource-group rg-smarthealth --name ssh-backend-220371 --settings MONGODB_URI="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority&appName=smartsupply-db"

# Set other settings
az webapp config appsettings set --resource-group rg-smarthealth --name ssh-backend-220371 --settings NODE_ENV="production"
az webapp config appsettings set --resource-group rg-smarthealth --name ssh-backend-220371 --settings PORT="5000"

# Restart App Service
az webapp restart --resource-group rg-smarthealth --name ssh-backend-220371
```

## 🧪 **Test Your Backend**

### **1. Check Health Endpoint**
```bash
curl https://ssh-backend-220371.azurewebsites.net/health
```

### **2. Check App Service Logs**
```bash
az webapp log tail --resource-group rg-smarthealth --name ssh-backend-220371
```

### **3. Test Frontend Integration**
- Visit: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
- Check if login works
- Verify API calls are successful

## 🔄 **Alternative: Deploy Container Apps Backend**

If App Service continues to have issues, deploy Container Apps:

### **1. Deploy to Pre-Production**
```bash
git push origin test
# This will deploy to: https://smartsupply-health-preprod.azurecontainerapps.io
```

### **2. Set MongoDB URI in Container Apps**
```bash
az containerapp secret set \
  --name smartsupply-health-preprod \
  --resource-group SmartSupply-Health-RG \
  --secrets mongodb-uri="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority&appName=smartsupply-db"
```

### **3. Update Frontend Configuration**
Update `frontend/src/config/environment.js`:
```javascript
production: {
  API_URL: 'https://smartsupply-health-preprod.azurecontainerapps.io',
  ENVIRONMENT: 'production'
}
```

## 📊 **Expected Results**

### **After Fixing App Service**
- ✅ Backend health: `https://ssh-backend-220371.azurewebsites.net/health`
- ✅ Frontend working: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
- ✅ Database connected successfully

### **After Deploying Container Apps**
- ✅ Backend health: `https://smartsupply-health-preprod.azurecontainerapps.io/health`
- ✅ Frontend working: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
- ✅ Better regional availability

## 🎯 **Recommended Action**

1. **Immediate**: Fix App Service backend using Azure Portal
2. **Short-term**: Test and verify everything works
3. **Long-term**: Migrate to Container Apps for better reliability

---

**✅ Follow Method 1 (Azure Portal) for the quickest fix!**
