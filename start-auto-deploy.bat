@echo off
echo 🚀 Starting SmartSupply Health Auto-Deploy...
echo.
echo This will automatically commit and push changes when you save files.
echo Press Ctrl+C to stop.
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start the auto-deploy watcher
echo 👀 Starting file watcher...
npm run auto-deploy

pause
