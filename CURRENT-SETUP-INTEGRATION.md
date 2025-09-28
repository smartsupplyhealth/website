# 🔗 Current Setup Integration Guide

## 🌐 **Your Current Architecture**

### **Frontend (Azure Static Web Apps)**
- **URL**: `https://stsmartsupply102615767.z28.web.core.windows.net`
- **Login**: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
- **Platform**: Azure Static Web Apps

### **Backend (Azure App Service)**
- **URL**: `https://ssh-backend-220371.azurewebsites.net`
- **Platform**: Azure App Service
- **Status**: Currently running and accessible

## 🔧 **Integration Options**

### **Option 1: Direct API Calls (Current Setup)**
Your frontend directly calls your backend API:

```javascript
// Frontend makes direct calls to backend
const response = await fetch('https://ssh-backend-220371.azurewebsites.net/api/endpoint');
```

**Pros:**
- ✅ Simple setup
- ✅ Direct communication
- ✅ Easy to debug

**Cons:**
- ❌ CORS issues possible
- ❌ Hardcoded backend URL
- ❌ No automatic failover

### **Option 2: Azure Static Web Apps API Integration (Recommended)**
Link your backend to Static Web Apps for automatic proxying:

```javascript
// Frontend calls /api routes (automatically proxied)
const response = await fetch('/api/endpoint');
```

**Pros:**
- ✅ Automatic CORS handling
- ✅ No hardcoded URLs
- ✅ Better security
- ✅ Automatic failover

**Cons:**
- ❌ Requires backend linking
- ❌ More complex setup

## 🚀 **Recommended Setup: Link Backend to Static Web Apps**

### **Step 1: Link Backend in Azure Portal**

1. **Go to Azure Portal**
2. **Navigate to your Static Web App**: `stsmartsupply102615767`
3. **Go to APIs section**
4. **Click "Link"**
5. **Select "App Service" as backend type**
6. **Choose your backend**: `ssh-backend-220371`
7. **Click "Link"**

### **Step 2: Update Frontend Configuration**

Once linked, update your frontend to use `/api` routes:

```javascript
// Instead of: https://ssh-backend-220371.azurewebsites.net/api/endpoint
// Use: /api/endpoint (automatically proxied)
```

### **Step 3: Update Environment Configuration**

```javascript
const config = {
  development: {
    API_URL: 'http://localhost:5000',
    ENVIRONMENT: 'development'
  },
  production: {
    API_URL: '', // Empty for Static Web Apps proxying
    API_PREFIX: '/api', // Use /api prefix for proxying
    ENVIRONMENT: 'production'
  }
};
```

## 🔄 **Migration Path: App Service → Container Apps**

### **Current State**
- ✅ Frontend: Azure Static Web Apps
- ✅ Backend: Azure App Service (`ssh-backend-220371.azurewebsites.net`)

### **Target State**
- ✅ Frontend: Azure Static Web Apps (same)
- ✅ Backend: Azure Container Apps (better regional availability)

### **Migration Steps**

1. **Keep Current Setup Running**
   - Don't change anything yet
   - Test current integration

2. **Deploy Container Apps Backend**
   - Use the pipelines we created
   - Deploy to pre-production first
   - Test thoroughly

3. **Switch Frontend to Container Apps**
   - Update environment configuration
   - Test integration
   - Switch production traffic

4. **Decommission App Service**
   - Only after Container Apps is stable
   - Keep App Service as backup initially

## 🧪 **Testing Your Current Setup**

### **Test Backend Health**
```bash
curl https://ssh-backend-220371.azurewebsites.net/health
```

### **Test Frontend-Backend Integration**
1. **Open Frontend**: `https://stsmartsupply102615767.z28.web.core.windows.net/login`
2. **Check Network Tab**: Verify API calls are working
3. **Test Login**: Ensure authentication works
4. **Test Features**: Verify all functionality works

### **Debug CORS Issues**
If you see CORS errors:

1. **Check Backend CORS Settings**
2. **Verify Frontend Domain is Allowed**
3. **Consider Linking Backend to Static Web Apps**

## 📊 **Current vs Future Architecture**

### **Current (App Service)**
```
Frontend (Static Web Apps)
https://stsmartsupply102615767.z28.web.core.windows.net
           ↓ Direct API calls
Backend (App Service)
https://ssh-backend-220371.azurewebsites.net
```

### **Future (Container Apps)**
```
Frontend (Static Web Apps)
https://stsmartsupply102615767.z28.web.core.windows.net
           ↓ /api routes (proxied)
Backend (Container Apps)
https://smartsupply-health-prod.azurecontainerapps.io
```

## 🎯 **Immediate Next Steps**

### **1. Test Current Setup**
- Verify frontend works with current backend
- Check for any CORS or integration issues
- Document any problems

### **2. Consider Linking Backend**
- Link App Service backend to Static Web Apps
- Update frontend to use `/api` routes
- Test the integration

### **3. Plan Container Apps Migration**
- Deploy Container Apps backend
- Test thoroughly in pre-production
- Plan migration timeline

## 🔍 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - **Solution**: Link backend to Static Web Apps
   - **Alternative**: Update backend CORS settings

2. **API Connection Failed**
   - **Check**: Backend health endpoint
   - **Verify**: Network connectivity
   - **Debug**: Browser network tab

3. **Authentication Issues**
   - **Check**: JWT token handling
   - **Verify**: Backend authentication endpoints
   - **Debug**: Check localStorage for token

---

**✅ Your current setup is working! Now you can choose to either optimize it or migrate to Container Apps for better regional availability.**
