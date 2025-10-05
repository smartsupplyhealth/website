#!/bin/bash

# Script principal pour construire toutes les images Docker
set -e

echo "🚀 Construction de toutes les images Docker SmartSupply Health"
echo "=============================================================="

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Fonction pour exécuter un script
run_script() {
    local script_name="$1"
    local script_path="${SCRIPT_DIR}/${script_name}"
    
    if [ -f "$script_path" ]; then
        echo "📋 Exécution de $script_name..."
        chmod +x "$script_path"
        "$script_path"
        echo "✅ $script_name terminé avec succès!"
        echo ""
    else
        echo "❌ Script non trouvé: $script_path"
        exit 1
    fi
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    echo "📥 Installez Docker depuis: https://docs.docker.com/get-docker/"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé!"
    echo "📥 Installez Docker Compose depuis: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "🔍 Vérification de l'environnement..."
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"
echo ""

# Changer vers le répertoire du projet
cd "$PROJECT_ROOT"

# Construire les images dans l'ordre
echo "🏗️ Construction des images Docker..."
echo ""

# 1. MongoDB
run_script "build-mongodb.sh"

# 2. Backend
run_script "build-backend.sh"

# 3. Frontend
run_script "build-frontend.sh"

# Afficher un résumé
echo "📊 Résumé des images construites:"
echo "================================="
docker images | grep -E "(smartsupply-backend|smartsupply-frontend|smartsupply-mongodb)" || echo "Aucune image SmartSupply trouvée"

echo ""
echo "🎉 Toutes les images ont été construites avec succès!"
echo ""
echo "📋 Commandes utiles:"
echo "==================="
echo "• Voir toutes les images: docker images"
echo "• Démarrer le backend: docker-compose -f docker-compose.backend.yml up -d"
echo "• Démarrer le frontend: docker-compose -f docker-compose.frontend.yml up -d"
echo "• Démarrer MongoDB: docker-compose -f docker-compose.mongodb.yml up -d"
echo "• Voir les logs: docker-compose logs -f"
echo "• Arrêter les services: docker-compose down"
echo ""
echo "🔗 Documentation: Voir CI-CD-README.md pour plus d'informations"
