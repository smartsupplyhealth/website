@echo off
echo ========================================
echo   SmartSupply-Health - Configuration Simple
echo ========================================
echo.

echo 1. Demarrage de MongoDB...
start "MongoDB" cmd /k "mongod --dbpath C:\data\db"

echo 2. Attente de MongoDB (5 secondes)...
timeout /t 5 /nobreak > nul

echo 3. Demarrage du Backend (Port 5000)...
start "Backend" cmd /k "cd backend && npm start"

echo 4. Attente du Backend (3 secondes)...
timeout /t 3 /nobreak > nul

echo 5. Demarrage du Frontend (Port 3000)...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Application demarree !
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ========================================
pause















