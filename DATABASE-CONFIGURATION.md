# 🗄️ Database Configuration Guide

## 📋 **Your MongoDB Atlas Configuration**

- **User**: `essayedneder0798_db_user`
- **Password**: `monia.0307`
- **Cluster**: `smartsupply-db.20el4bx.mongodb.net`
- **Database**: `smartsupply-db`

## 🔗 **Connection String**

### **MongoDB Atlas Connection String**
```
mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority
```

### **URL Encoded Version** (for environment variables)
```
mongodb%2Bsrv%3A//essayedneder0798_db_user%3Amonia.0307%40smartsupply-db.20el4bx.mongodb.net/smartsupply-db%3FretryWrites%3Dtrue%26w%3Dmajority
```

## 🔧 **Environment Variables Setup**

### **For Container Apps (Recommended)**
```bash
# Set MongoDB URI secret
az containerapp secret set \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --secrets mongodb-uri="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority"
```

### **For App Service (Current)**
```bash
# Set MongoDB URI in App Service
az webapp config appsettings set \
  --resource-group SmartSupply-Health-RG \
  --name ssh-backend-220371 \
  --settings MONGODB_URI="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority"
```

## 🧪 **Test Database Connection**

### **Test Connection String**
```bash
# Test with MongoDB Compass or CLI
mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority
```

### **Test from Backend**
```javascript
// Test in your backend code
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));
```

## 🔒 **Security Considerations**

### **IP Whitelist**
Make sure your MongoDB Atlas cluster allows connections from:
- **Azure App Service IPs**: Add Azure App Service outbound IPs
- **Container Apps IPs**: Add Container Apps outbound IPs
- **Your Development IP**: Add your local IP for development

### **Database User Permissions**
- ✅ **Read/Write Access**: Ensure user has proper permissions
- ✅ **Database Access**: Verify access to `smartsupply-db`
- ✅ **Collection Access**: Check collection-level permissions

## 🚀 **Deployment Steps**

### **Step 1: Fix App Service Backend**
```bash
# Set MongoDB URI in App Service
az webapp config appsettings set \
  --resource-group SmartSupply-Health-RG \
  --name ssh-backend-220371 \
  --settings MONGODB_URI="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority"

# Restart App Service
az webapp restart \
  --resource-group SmartSupply-Health-RG \
  --name ssh-backend-220371
```

### **Step 2: Deploy Container Apps Backend**
```bash
# Deploy to pre-production
git push origin test

# Set MongoDB URI in Container Apps
az containerapp secret set \
  --name smartsupply-health-preprod \
  --resource-group SmartSupply-Health-RG \
  --secrets mongodb-uri="mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db?retryWrites=true&w=majority"
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Connection Timeout**
   - Check IP whitelist in MongoDB Atlas
   - Verify network connectivity
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check user permissions
   - Ensure user exists in MongoDB Atlas

3. **Database Not Found**
   - Verify database name: `smartsupply-db`
   - Check if database exists
   - Verify user has access to database

### **Debug Commands**

```bash
# Test MongoDB connection
mongosh "mongodb+srv://essayedneder0798_db_user:monia.0307@smartsupply-db.20el4bx.mongodb.net/smartsupply-db"

# Check App Service logs
az webapp log tail --resource-group SmartSupply-Health-RG --name ssh-backend-220371

# Check Container App logs
az containerapp logs show --name smartsupply-health-prod --resource-group SmartSupply-Health-RG
```

## 📊 **Database Schema**

Your database should contain collections for:
- **Users**: Client and supplier accounts
- **Products**: Product catalog
- **Orders**: Order management
- **Inventory**: Client inventory tracking
- **Payments**: Payment processing
- **Statistics**: Analytics data

---

**✅ With this database configuration, your backend should be able to connect successfully!**
