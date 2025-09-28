# 🔗 Frontend-Backend Integration Guide

This guide explains how your Azure Static Web App frontend integrates with your new Container Apps backend.

## 🌐 **Current Setup**

### **Frontend (Azure Static Web Apps)**
- **URL**: `https://stsmartsupply102615767.z28.web.core.windows.net`
- **Login**: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
- **Platform**: Azure Static Web Apps

### **Backend (Azure Container Apps)**
- **Pre-Production**: `https://smartsupply-health-preprod.azurecontainerapps.io`
- **Production**: `https://smartsupply-health-prod.azurecontainerapps.io`
- **Platform**: Azure Container Apps

## 🔧 **Configuration Updates**

### **1. Environment Configuration**
Created `frontend/src/config/environment.js` to handle different environments:

```javascript
const config = {
  development: {
    API_URL: 'http://localhost:5000',
    ENVIRONMENT: 'development'
  },
  staging: {
    API_URL: 'https://smartsupply-health-preprod.azurecontainerapps.io',
    ENVIRONMENT: 'staging'
  },
  production: {
    API_URL: 'https://smartsupply-health-prod.azurecontainerapps.io',
    ENVIRONMENT: 'production'
  }
};
```

### **2. Updated API Calls**
All frontend components now use the environment configuration:

- `frontend/src/services/api.js` - Main API service
- `frontend/src/components/NewOrder.jsx` - Order management
- `frontend/src/components/ClientInventory.jsx` - Inventory management
- `frontend/src/components/SupplierClients.jsx` - Client management
- `frontend/src/components/SupplierOrders.jsx` - Order management
- `frontend/src/components/dashboard/SupplierDashboard.jsx` - Dashboard

### **3. Static Web App Configuration**
Created `frontend/staticwebapp.config.json` for proper routing and CORS handling.

## 🚀 **Deployment Process**

### **For Development**
```bash
# Frontend uses localhost backend
npm start
# Backend runs on http://localhost:5000
```

### **For Staging/Pre-Production**
```bash
# Deploy backend to pre-production
git checkout test
git push origin test
# Backend: https://smartsupply-health-preprod.azurecontainerapps.io

# Deploy frontend (will use pre-production backend)
# Frontend: https://stsmartsupply102615767.z28.web.core.windows.net
```

### **For Production**
```bash
# Deploy backend to production
git checkout main
git merge test
git push origin main
# Backend: https://smartsupply-health-prod.azurecontainerapps.io

# Frontend automatically uses production backend
# Frontend: https://stsmartsupply102615767.z28.web.core.windows.net
```

## 🔄 **Environment Detection**

The frontend automatically detects the environment based on:

1. **Environment Variable**: `REACT_APP_ENVIRONMENT`
2. **API URL**: If `REACT_APP_API_URL` is set
3. **Default**: Falls back to development

### **Setting Environment Variables**

#### **For Azure Static Web Apps**
Add these in your Azure Static Web App configuration:

```bash
# For staging
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_URL=https://smartsupply-health-preprod.azurecontainerapps.io

# For production
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://smartsupply-health-prod.azurecontainerapps.io
```

#### **For Local Development**
Create `.env.local` file in frontend directory:

```bash
REACT_APP_ENVIRONMENT=development
REACT_APP_API_URL=http://localhost:5000
```

## 🧪 **Testing the Integration**

### **1. Test Pre-Production**
```bash
# 1. Deploy backend to pre-production
git checkout test
git push origin test

# 2. Wait for deployment to complete
# Check: https://smartsupply-health-preprod.azurecontainerapps.io/health

# 3. Update frontend environment (if needed)
# Set REACT_APP_ENVIRONMENT=staging in Azure Static Web App

# 4. Test frontend
# Visit: https://stsmartsupply102615767.z28.web.core.windows.net/login
```

### **2. Test Production**
```bash
# 1. Deploy backend to production
git checkout main
git merge test
git push origin main

# 2. Wait for deployment to complete
# Check: https://smartsupply-health-prod.azurecontainerapps.io/health

# 3. Test frontend
# Visit: https://stsmartsupply102615767.z28.web.core.windows.net/login
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - **Solution**: Check `staticwebapp.config.json` configuration
   - **Verify**: Backend CORS settings allow your frontend domain

2. **API Connection Failed**
   - **Check**: Backend health endpoint
   - **Verify**: Environment configuration
   - **Debug**: Check browser network tab

3. **Authentication Issues**
   - **Check**: JWT token handling
   - **Verify**: Backend authentication endpoints
   - **Debug**: Check localStorage for token

### **Debug Commands**

```bash
# Check backend health
curl https://smartsupply-health-prod.azurecontainerapps.io/health

# Check frontend environment
# Open browser console and run:
console.log(process.env.REACT_APP_API_URL);

# Check API configuration
# In browser console:
console.log(window.location.origin);
```

## 📊 **Monitoring**

### **Frontend Monitoring**
- **Azure Static Web Apps**: Check deployment logs
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API calls

### **Backend Monitoring**
- **Container App Logs**: `az containerapp logs show --name smartsupply-health-prod --resource-group SmartSupply-Health-RG`
- **Health Checks**: Monitor `/health` endpoint
- **Azure Monitor**: Check performance metrics

## 🎯 **Next Steps**

1. **Deploy Backend**: Use the Container Apps pipelines
2. **Test Integration**: Verify frontend-backend communication
3. **Monitor Performance**: Set up alerts and monitoring
4. **Optimize**: Fine-tune based on usage patterns

---

**✅ Your frontend is now properly configured to work with your Container Apps backend!**
