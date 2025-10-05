# Script PowerShell de build pour SmartSupply Health

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod", "clean", "logs", "stop", "help")]
    [string]$Action = "help"
)

# Fonction d'aide
function Show-Help {
    Write-Host "🚀 Script de build SmartSupply Health" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\build.ps1 [OPTION]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  dev     - Build et démarrage en mode développement" -ForegroundColor White
    Write-Host "  prod    - Build et démarrage en mode production" -ForegroundColor White
    Write-Host "  clean   - Nettoyage des images et volumes Docker" -ForegroundColor White
    Write-Host "  logs    - Affichage des logs" -ForegroundColor White
    Write-Host "  stop    - Arrêt des services" -ForegroundColor White
    Write-Host "  help    - Affichage de cette aide" -ForegroundColor White
}

# Fonction de build en développement
function Build-Dev {
    Write-Host "🔧 Build en mode développement..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    Write-Host "✅ Services de développement démarrés!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "🗄️ MongoDB: localhost:27017" -ForegroundColor Cyan
}

# Fonction de build en production
function Build-Prod {
    Write-Host "🏭 Build en mode production..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.yml build --no-cache
    docker-compose -f docker-compose.yml up -d
    Write-Host "✅ Services de production démarrés!" -ForegroundColor Green
    Write-Host "🌐 Application: http://localhost" -ForegroundColor Cyan
}

# Fonction de nettoyage
function Clean-Docker {
    Write-Host "🧹 Nettoyage des images et volumes Docker..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
    docker system prune -f
    docker volume prune -f
    Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
}

# Fonction d'affichage des logs
function Show-Logs {
    Write-Host "📋 Logs des services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml logs -f
}

# Fonction d'arrêt
function Stop-Services {
    Write-Host "🛑 Arrêt des services..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    Write-Host "✅ Services arrêtés!" -ForegroundColor Green
}

# Gestion des actions
switch ($Action) {
    "dev" {
        Build-Dev
    }
    "prod" {
        Build-Prod
    }
    "clean" {
        Clean-Docker
    }
    "logs" {
        Show-Logs
    }
    "stop" {
        Stop-Services
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ Option invalide: $Action" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
