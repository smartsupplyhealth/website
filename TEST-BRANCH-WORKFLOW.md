# Test Branch Workflow Guide

This guide explains how to use the test branch for safe development and testing before merging to main.

## 🌿 Branch Structure

- **`main`** - Production branch (deploys to production Container App)
- **`test`** - Testing branch (deploys to test Container App)

## 🚀 Workflow Process

### 1. Development on Test Branch

```bash
# Make sure you're on the test branch
git checkout test

# Make your changes
# ... edit files ...

# Commit your changes
git add .
git commit -m "feat: add new feature"

# Push to test branch
git push origin test
```

### 2. Automatic Test Deployment

When you push to the `test` branch:
- ✅ GitHub Actions automatically builds and deploys to test environment
- ✅ Runs health checks to ensure deployment is successful
- ✅ Creates a test Container App: `smartsupply-health-test`

### 3. Testing Your Changes

After deployment, test your changes:
- **Test URL**: `https://smartsupply-health-test.azurecontainerapps.io`
- **Health Check**: `https://smartsupply-health-test.azurecontainerapps.io/health`

### 4. Merge to Main (Production)

Once you're satisfied with testing:

```bash
# Switch to main branch
git checkout main

# Merge test branch
git merge test

# Push to main (triggers production deployment)
git push origin main
```

## 🔧 Manual Deployment Commands

### Deploy to Test Environment
```powershell
# PowerShell (Windows)
.\scripts\deploy-to-container-app.ps1 -Test

# Bash (Linux/Mac)
./scripts/deploy-to-container-app.sh --test
```

### Deploy to Production Environment
```powershell
# PowerShell (Windows)
.\scripts\deploy-to-container-app.ps1

# Bash (Linux/Mac)
./scripts/deploy-to-container-app.sh
```

## 📋 Environment Differences

| Feature | Test Environment | Production Environment |
|---------|------------------|----------------------|
| Container App Name | `smartsupply-health-test` | `smartsupply-health` |
| Environment Name | `smartsupply-env-test` | `smartsupply-env` |
| URL | `*.azurecontainerapps.io` | `*.azurecontainerapps.io` |
| Scaling | 1-5 replicas | 1-10 replicas |
| Resources | 0.5 CPU, 1Gi RAM | 1 CPU, 2Gi RAM |

## 🛡️ Safety Features

1. **Separate Environments**: Test and production are completely isolated
2. **Automatic Health Checks**: Ensures deployments are working
3. **Rollback Capability**: Easy to revert if issues arise
4. **Resource Limits**: Test environment uses fewer resources to save costs

## 🔍 Monitoring

### View Test Environment Logs
```bash
az containerapp logs show --name smartsupply-health-test --resource-group smartsupply-rg --follow
```

### View Production Environment Logs
```bash
az containerapp logs show --name smartsupply-health --resource-group smartsupply-rg --follow
```

## 🚨 Troubleshooting

### Test Deployment Failed
1. Check GitHub Actions logs
2. Verify Azure credentials
3. Check Container App logs
4. Ensure all environment variables are set

### Production Issues After Merge
1. Check if test environment was working
2. Compare test vs production configurations
3. Rollback by reverting the merge commit
4. Investigate differences between environments

## 💡 Best Practices

1. **Always test on test branch first**
2. **Run health checks after deployment**
3. **Test all critical functionality**
4. **Keep test branch up to date with main**
5. **Use descriptive commit messages**
6. **Document any breaking changes**

## 🔄 Branch Management

### Keep Test Branch Updated
```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Switch to test
git checkout test

# Merge main into test
git merge main

# Push updated test branch
git push origin test
```

### Clean Up After Merge
```bash
# After successful merge to main
git checkout main
git branch -d test  # Delete local test branch
git push origin --delete test  # Delete remote test branch
git checkout -b test  # Create fresh test branch
```

This workflow ensures safe development and deployment practices while maintaining a clean git history.
