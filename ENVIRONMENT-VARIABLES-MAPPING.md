# 🔧 Environment Variables Mapping: App Service → Container Apps

This document shows how to map your existing App Service environment variables to Container Apps.

## 📋 **Current App Service Variables**

Based on your existing `azure-deploy.yml`, here are your current environment variables:

```yaml
NODE_ENV=production
MONGODB_URI="${{ secrets.MONGODB_URI }}"
JWT_SECRET="${{ secrets.JWT_SECRET }}"
SENDGRID_API_KEY="${{ secrets.SENDGRID_API_KEY }}"
STRIPE_SECRET_KEY="${{ secrets.STRIPE_SECRET_KEY }}"
GOOGLE_AI_API_KEY="${{ secrets.GOOGLE_AI_API_KEY }}"
```

## 🎯 **Container Apps Mapping**

### **Direct Environment Variables**
These are set directly in the Container App configuration:

| App Service | Container App | Value | Description |
|-------------|---------------|-------|-------------|
| `NODE_ENV` | `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `PORT` | `5000` | Application port |

### **Secret Environment Variables**
These are stored as secrets and referenced as environment variables:

| App Service | Container App Secret | Container App Env Var | Description |
|-------------|---------------------|---------------------|-------------|
| `MONGODB_URI` | `mongodb-uri` | `MONGODB_URI` | Database connection string |
| `JWT_SECRET` | `jwt-secret` | `JWT_SECRET` | JWT signing secret |
| `SENDGRID_API_KEY` | `sendgrid-api-key` | `SENDGRID_API_KEY` | Email service API key |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | `STRIPE_SECRET_KEY` | Payment processing key |
| `GOOGLE_AI_API_KEY` | `google-api-key` | `GOOGLE_API_KEY` | Google AI API key |

## 🚀 **Implementation in Container Apps**

### **1. Using Azure CLI**
```bash
# Create Container App with secrets
az containerapp create \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --environment smartsupply-env \
  --image smartsupplyregistry.azurecr.io/smartsupply-health:latest \
  --target-port 5000 \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    PORT=5000 \
  --secrets \
    mongodb-uri="your-mongodb-connection-string" \
    jwt-secret="your-jwt-secret" \
    stripe-secret-key="your-stripe-secret" \
    sendgrid-api-key="your-sendgrid-key" \
    google-api-key="your-google-key" \
  --secret-env-vars \
    MONGODB_URI=mongodb-uri \
    JWT_SECRET=jwt-secret \
    STRIPE_SECRET_KEY=stripe-secret-key \
    SENDGRID_API_KEY=sendgrid-api-key \
    GOOGLE_API_KEY=google-api-key
```

### **2. Using YAML Configuration**
```yaml
apiVersion: 2022-03-01
kind: ContainerApp
properties:
  configuration:
    secrets:
      - name: mongodb-uri
        value: "your-mongodb-connection-string"
      - name: jwt-secret
        value: "your-jwt-secret"
      - name: stripe-secret-key
        value: "your-stripe-secret"
      - name: sendgrid-api-key
        value: "your-sendgrid-key"
      - name: google-api-key
        value: "your-google-key"
  template:
    containers:
      - name: smartsupply-health
        image: smartsupplyregistry.azurecr.io/smartsupply-health:latest
        env:
          - name: NODE_ENV
            value: "production"
          - name: PORT
            value: "5000"
          - name: MONGODB_URI
            secretRef: mongodb-uri
          - name: JWT_SECRET
            secretRef: jwt-secret
          - name: STRIPE_SECRET_KEY
            secretRef: stripe-secret-key
          - name: SENDGRID_API_KEY
            secretRef: sendgrid-api-key
          - name: GOOGLE_API_KEY
            secretRef: google-api-key
```

## 🔄 **GitHub Actions Integration**

### **Pre-Production Pipeline** (test branch)
```yaml
env:
  ENVIRONMENT: preprod
  AZURE_CONTAINER_REGISTRY: smartsupplyregistry.azurecr.io
  CONTAINER_APP_NAME: smartsupply-health-preprod
  RESOURCE_GROUP: SmartSupply-Health-RG
```

### **Production Pipeline** (main branch)
```yaml
env:
  ENVIRONMENT: production
  AZURE_CONTAINER_REGISTRY: smartsupplyregistry.azurecr.io
  CONTAINER_APP_NAME: smartsupply-health-prod
  RESOURCE_GROUP: SmartSupply-Health-RG
```

## 🔐 **Secrets Management**

### **GitHub Secrets (Keep These)**
- `AZURE_CREDENTIALS` - Service principal for Azure access
- `ACR_USERNAME` - Container registry username
- `ACR_PASSWORD` - Container registry password
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `SENDGRID_API_KEY` - Email service API key
- `STRIPE_SECRET_KEY` - Payment processing key
- `GOOGLE_AI_API_KEY` - Google AI API key

### **Container App Secrets**
These are created automatically by the GitHub Actions workflow using the GitHub secrets.

## 🧪 **Testing Environment Variables**

### **Check if variables are set correctly:**
```bash
# Connect to Container App
az containerapp exec \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG

# Inside the container, check environment variables
echo $NODE_ENV
echo $PORT
echo $MONGODB_URI
echo $JWT_SECRET
```

### **Test application startup:**
```bash
# Check Container App logs
az containerapp logs show \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --follow
```

## 🚨 **Common Issues and Solutions**

### **1. Secret Not Found**
**Error**: `Secret 'mongodb-uri' not found`
**Solution**: Ensure the secret is created before referencing it
```bash
az containerapp secret set \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --secrets mongodb-uri="your-connection-string"
```

### **2. Environment Variable Not Set**
**Error**: `Environment variable 'MONGODB_URI' is undefined`
**Solution**: Check the secret-env-vars mapping
```bash
az containerapp update \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --set-env-vars MONGODB_URI=mongodb-uri
```

### **3. Application Won't Start**
**Error**: Application fails to start
**Solution**: Check logs and verify all required variables are set
```bash
# Check startup logs
az containerapp logs show \
  --name smartsupply-health-prod \
  --resource-group SmartSupply-Health-RG \
  --follow
```

## 📊 **Environment Comparison**

| Feature | App Service | Container Apps |
|---------|-------------|----------------|
| **Variable Storage** | App Settings | Secrets + Env Vars |
| **Security** | Encrypted at rest | Encrypted at rest |
| **Access** | Azure Portal/CLI | Azure Portal/CLI |
| **Updates** | Restart required | Rolling update |
| **Backup** | Automatic | Manual (recommended) |

## 🎯 **Migration Checklist**

- [ ] Document current App Service environment variables
- [ ] Create Container App secrets
- [ ] Map environment variables correctly
- [ ] Test in pre-production environment
- [ ] Verify all functionality works
- [ ] Deploy to production
- [ ] Monitor and validate

---

**✅ Your environment variables are now properly mapped for Container Apps deployment!**
