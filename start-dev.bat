@echo off
echo Starting SmartSupply Health Development Environment...
echo.

echo Stopping any existing containers...
docker-compose -f docker-compose.dev.yml down

echo.
echo Building development images...
docker-compose -f docker-compose.dev.yml build

echo.
echo Starting development services...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo Development environment is starting up!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo MongoDB: localhost:27017
echo.
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo To stop: docker-compose -f docker-compose.dev.yml down
echo.
pause
