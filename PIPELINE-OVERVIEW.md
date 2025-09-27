# 🚀 CI/CD Pipeline Overview

This document describes the two-pipeline CI/CD setup for SmartSupply Health application.

## 📋 Pipeline Structure

### 🧪 **PREPROD Pipeline** (`.github/workflows/preprod-pipeline.yml`)
- **Trigger**: `test` branch pushes and pull requests
- **Purpose**: Pre-production testing and validation
- **Environment**: Pre-production
- **Container App**: `smartsupply-health-preprod`

### 🚀 **PROD Pipeline** (`.github/workflows/prod-pipeline.yml`)
- **Trigger**: `main` branch pushes only
- **Purpose**: Production deployment
- **Environment**: Production
- **Container App**: `smartsupply-health-prod`

## 🔧 Environment Configurations

| Feature | Pre-Production | Production |
|---------|----------------|------------|
| **Branch** | `test` | `main` |
| **Container App Name** | `smartsupply-health-preprod` | `smartsupply-health-prod` |
| **CPU Limit** | 1.0 | 2.0 |
| **Memory Limit** | 2Gi | 4Gi |
| **Min Replicas** | 1 | 2 |
| **Max Replicas** | 5 | 20 |
| **Purpose** | Testing & Validation | Live Production |
| **Cost** | Lower (optimized) | Higher (performance) |

## 🔄 Workflow Process

### 1. **Development Workflow**
```bash
# Start development on test branch
git checkout test

# Make changes
# ... edit files ...

# Commit and push to test branch
git add .
git commit -m "feat: new feature"
git push origin test
```

### 2. **Pre-Production Deployment**
- ✅ **Automatic**: Triggered by push to `test` branch
- ✅ **Build**: Docker image built and pushed to ACR
- ✅ **Deploy**: Deployed to pre-production Container App
- ✅ **Test**: Health checks and validation
- ✅ **Notify**: PR comments with deployment info

### 3. **Production Deployment**
```bash
# When ready for production
git checkout main
git merge test
git push origin main
```

- ✅ **Automatic**: Triggered by push to `main` branch
- ✅ **Build**: Docker image built and pushed to ACR
- ✅ **Deploy**: Deployed to production Container App
- ✅ **Verify**: Production health checks

## 🛠️ Pipeline Features

### **Pre-Production Pipeline**
- 🧪 **Testing Environment**: Safe testing before production
- 💰 **Cost Optimized**: Lower resource allocation
- 🔍 **Health Checks**: Automatic validation
- 📝 **PR Comments**: Deployment status in pull requests
- 🚀 **Manual Trigger**: Can be triggered manually

### **Production Pipeline**
- 🚀 **Production Ready**: High-performance configuration
- 🔒 **Secure**: Only from main branch
- 📊 **Scalable**: Auto-scaling based on demand
- 🔍 **Health Checks**: Production validation
- 🚀 **Manual Trigger**: Can be triggered manually

## 📊 Monitoring & Logs

### **View Pipeline Status**
- GitHub Actions tab shows all pipeline runs
- Green checkmark = Success
- Red X = Failed (check logs)

### **View Container App Logs**
```bash
# Pre-production logs
az containerapp logs show --name smartsupply-health-preprod --resource-group smartsupply-rg --follow

# Production logs
az containerapp logs show --name smartsupply-health-prod --resource-group smartsupply-rg --follow
```

### **Health Check URLs**
- **Pre-Production**: `https://smartsupply-health-preprod.azurecontainerapps.io/health`
- **Production**: `https://smartsupply-health-prod.azurecontainerapps.io/health`

## 🔧 Manual Operations

### **Trigger Manual Deployment**
1. Go to GitHub Actions tab
2. Select the pipeline (Preprod or Prod)
3. Click "Run workflow"
4. Choose environment and click "Run workflow"

### **Scale Container Apps**
```bash
# Scale pre-production
az containerapp update --name smartsupply-health-preprod --resource-group smartsupply-rg --min-replicas 2 --max-replicas 10

# Scale production
az containerapp update --name smartsupply-health-prod --resource-group smartsupply-rg --min-replicas 5 --max-replicas 50
```

## 🚨 Troubleshooting

### **Pipeline Failures**
1. **Check GitHub Actions logs** for detailed error messages
2. **Verify Azure credentials** in repository secrets
3. **Check Container App status** in Azure portal
4. **Review resource limits** and quotas

### **Common Issues**
- **Build failures**: Check Dockerfile and dependencies
- **Deployment failures**: Verify Azure Container Registry access
- **Health check failures**: Check application health endpoint
- **Resource issues**: Verify CPU/memory limits

## 🔒 Security Features

- **Branch Protection**: Production only from main branch
- **Secrets Management**: Azure credentials stored securely
- **Non-root Containers**: Security-hardened Docker images
- **HTTPS Only**: All endpoints use secure connections
- **Resource Limits**: Prevent resource exhaustion

## 💡 Best Practices

1. **Always test in pre-production first**
2. **Use descriptive commit messages**
3. **Monitor pipeline status regularly**
4. **Keep test branch up to date with main**
5. **Review deployment logs after each release**
6. **Test health endpoints after deployment**

## 📈 Performance Optimization

- **Docker Layer Caching**: Faster builds
- **Resource Scaling**: Auto-scale based on demand
- **Health Checks**: Quick failure detection
- **Rolling Deployments**: Zero-downtime updates
- **Cost Optimization**: Right-sized resources per environment

This two-pipeline setup ensures safe, reliable, and efficient deployments while maintaining clear separation between testing and production environments.
