# 🚀 SmartSupply Health - Auto-Deploy Setup

This guide shows you how to set up **fully automatic deployment** without manually running `git push` commands.

## 🎯 What You Get

- **Automatic Git Commits**: Changes are automatically committed when you save files
- **Automatic Push**: Commits are automatically pushed to GitHub
- **Automatic Pipeline**: GitHub Actions runs your CI/CD pipeline automatically
- **Real-time Deployment**: Your changes go live without any manual intervention

## 🛠️ Setup Options

### Option 1: File Watcher (Recommended)

**Start the auto-deploy watcher:**

```bash
# Install dependencies
npm install

# Start auto-deploy
npm run auto-deploy
```

**What happens:**
- Watches all your files for changes
- Automatically commits changes when you save
- Automatically pushes to GitHub
- Triggers your CI/CD pipeline

### Option 2: VS Code Integration

**Install the "Run on Save" extension:**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Run on Save"
4. Install the extension

**Configure auto-deploy:**
1. Open your project in VS Code
2. The `.vscode/settings.json` is already configured
3. Save any file and it will auto-deploy!

### Option 3: Windows Batch File

**Double-click to start:**
- `start-auto-deploy.bat` (Command Prompt)
- `start-auto-deploy.ps1` (PowerShell)

### Option 4: Webhook Trigger

**Trigger deployment via API:**
```bash
# Trigger deployment
curl -X POST http://localhost:5000/api/webhook/deploy

# Check webhook health
curl http://localhost:5000/api/webhook/health
```

## 🔧 How It Works

1. **File Change Detected** → File watcher detects you saved a file
2. **Auto Commit** → Changes are automatically committed with timestamp
3. **Auto Push** → Commit is automatically pushed to GitHub
4. **Pipeline Triggers** → GitHub Actions runs your CI/CD pipeline
5. **Auto Deploy** → Your changes are automatically deployed

## 📁 Files Watched

The auto-deploy watches these file types:
- `frontend/src/**/*` (React components)
- `backend/**/*` (Node.js backend)
- `*.md` (Documentation)
- `*.json` (Configuration)
- `*.yml`, `*.yaml` (GitHub Actions)
- `Dockerfile`, `docker-compose.yml`

## 🚫 Files Ignored

These files are ignored to prevent unnecessary deployments:
- `node_modules/**`
- `build/**`, `dist/**`
- `.git/**`
- `uploads/**`
- `*.log`
- `.env`

## ⚙️ Configuration

### Customize Commit Messages

Edit `auto-deploy.js` to change the commit message format:

```javascript
const commitMessage = `Your custom message: ${timestamp}`;
```

### Change Watch Delay

Modify the debounce delay in `auto-deploy.js`:

```javascript
commitTimeout = setTimeout(() => {
  commitAndPush();
}, 5000); // Change 5000ms to your preferred delay
```

### Add More File Types

Edit the watch patterns in `auto-deploy.js`:

```javascript
const watcher = chokidar.watch([
  'frontend/src/**/*',
  'backend/**/*',
  'your-custom-folder/**/*' // Add your custom folder
], {
  // ... rest of config
});
```

## 🎮 Usage Examples

### Start Auto-Deploy
```bash
npm run auto-deploy
```

### Start Development with Auto-Deploy
```bash
npm run dev
# In another terminal:
npm run auto-deploy
```

### Manual Deploy (if needed)
```bash
git add .
git commit -m "Manual deploy"
git push
```

## 🔍 Monitoring

### Check Auto-Deploy Status
- Look at the console output
- Green checkmarks = success
- Red X = error

### Check GitHub Pipeline
- Go to: https://github.com/smartsupplyhealth/website/actions
- See all automatic deployments

### Check Deployment Logs
- Backend logs: Check your server console
- Frontend logs: Check browser console
- Pipeline logs: Check GitHub Actions

## 🚨 Troubleshooting

### Auto-Deploy Not Working?
1. Check if `chokidar` is installed: `npm list chokidar`
2. Check file permissions
3. Check if Git is configured properly
4. Check console for error messages

### Files Not Being Watched?
1. Check if files are in ignored patterns
2. Check file paths are correct
3. Restart the auto-deploy watcher

### Pipeline Not Triggering?
1. Check GitHub repository settings
2. Check if GitHub Actions are enabled
3. Check the workflow files in `.github/workflows/`

## 🎉 Benefits

- **Zero Manual Work**: No more `git add`, `git commit`, `git push`
- **Instant Deployment**: Changes go live automatically
- **Always Up-to-Date**: Your repository is always current
- **Professional Workflow**: Industry-standard CI/CD pipeline
- **Time Saving**: Focus on coding, not deployment

## 🔒 Security Notes

- Never commit sensitive files (`.env`, passwords, keys)
- The `.gitignore` file protects sensitive data
- Webhook endpoints should be secured in production
- Use environment variables for sensitive configuration

---

**🎯 Result**: Just save your files and watch them automatically deploy! No more manual Git commands needed! 🚀
