@echo off
echo 🚀 SmartSupply Health - Azure Deployment
echo =====================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available
    pause
    exit /b 1
)

REM Run the PowerShell deployment script
echo 📋 Starting Azure deployment...
echo.
powershell -ExecutionPolicy Bypass -File "deploy-to-azure.ps1"

echo.
echo ✅ Deployment script completed!
echo.
pause
