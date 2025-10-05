#!/bin/bash

# Script de build pour SmartSupply Health

echo "🚀 Build de SmartSupply Health..."

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTION]"
    echo "Options:"
    echo "  dev     - Build et démarrage en mode développement"
    echo "  prod    - Build et démarrage en mode production"
    echo "  clean   - Nettoyage des images et volumes Docker"
    echo "  logs    - Affichage des logs"
    echo "  stop    - Arrêt des services"
    echo "  help    - Affichage de cette aide"
}

# Fonction de build en développement
build_dev() {
    echo "🔧 Build en mode développement..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    echo "✅ Services de développement démarrés!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:5000"
    echo "🗄️ MongoDB: localhost:27017"
}

# Fonction de build en production
build_prod() {
    echo "🏭 Build en mode production..."
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.yml build --no-cache
    docker-compose -f docker-compose.yml up -d
    echo "✅ Services de production démarrés!"
    echo "🌐 Application: http://localhost"
}

# Fonction de nettoyage
clean_docker() {
    echo "🧹 Nettoyage des images et volumes Docker..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
    docker system prune -f
    docker volume prune -f
    echo "✅ Nettoyage terminé!"
}

# Fonction d'affichage des logs
show_logs() {
    echo "📋 Logs des services..."
    docker-compose -f docker-compose.yml logs -f
}

# Fonction d'arrêt
stop_services() {
    echo "🛑 Arrêt des services..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    echo "✅ Services arrêtés!"
}

# Gestion des arguments
case "$1" in
    dev)
        build_dev
        ;;
    prod)
        build_prod
        ;;
    clean)
        clean_docker
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Option invalide: $1"
        show_help
        exit 1
        ;;
esac
