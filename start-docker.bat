@echo off
echo ========================================
echo   SmartSupply-Health - Docker Simple
echo ========================================
echo.

echo 1. Arret des conteneurs existants...
docker-compose down

echo 2. Demarrage des conteneurs...
docker-compose up -d

echo 3. Attente du demarrage (10 secondes)...
timeout /t 10 /nobreak > nul

echo 4. Verification des conteneurs...
docker-compose ps

echo.
echo ========================================
echo   Application demarree !
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   MongoDB:  localhost:27017
echo ========================================
echo.
echo Pour arreter: docker-compose down
echo Pour voir les logs: docker-compose logs -f
pause















