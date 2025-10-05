#!/bin/bash

# Script pour exécuter le conteneur All-in-One
set -e

echo "🚀 Démarrage de SmartSupply Health All-in-One"
echo "============================================="

# Variables
CONTAINER_NAME="smartsupply-all-in-one"
IMAGE_NAME="smartsupply-all-in-one:latest"
COMPOSE_FILE="docker-compose.all-in-one.yml"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé!"
    exit 1
fi

# Vérifier que l'image existe
if ! docker images | grep -q "smartsupply-all-in-one"; then
    echo "❌ Image ${IMAGE_NAME} non trouvée!"
    echo "📦 Construisez d'abord l'image avec: ./scripts/build-all-in-one.sh"
    exit 1
fi

# Arrêter le conteneur s'il existe déjà
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo "🛑 Arrêt du conteneur existant..."
    docker-compose -f "${COMPOSE_FILE}" down
fi

# Démarrer le conteneur
echo "🚀 Démarrage du conteneur All-in-One..."
docker-compose -f "${COMPOSE_FILE}" up -d

# Attendre que les services démarrent
echo "⏳ Attente que les services démarrent (30 secondes)..."
sleep 30

# Vérifier le statut
echo "📊 Statut du conteneur:"
docker-compose -f "${COMPOSE_FILE}" ps

# Vérifier la santé
echo "💚 Vérification de la santé des services..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Tous les services sont opérationnels!"
else
    echo "⚠️ Certains services ne répondent pas encore"
    echo "📋 Vérifiez les logs avec: docker-compose -f ${COMPOSE_FILE} logs -f"
fi

echo ""
echo "🌐 Services disponibles:"
echo "======================="
echo "• Frontend: http://localhost/"
echo "• API Backend: http://localhost/api/"
echo "• Health Check: http://localhost/health"
echo "• MongoDB: localhost:27017"
echo ""

echo "📋 Commandes utiles:"
echo "==================="
echo "• Voir les logs: docker-compose -f ${COMPOSE_FILE} logs -f"
echo "• Arrêter: docker-compose -f ${COMPOSE_FILE} down"
echo "• Redémarrer: docker-compose -f ${COMPOSE_FILE} restart"
echo "• Accéder au conteneur: docker exec -it ${CONTAINER_NAME} sh"
echo "• Voir les processus: docker exec -it ${CONTAINER_NAME} supervisorctl status"
echo ""

echo "🎉 SmartSupply Health All-in-One est démarré!"
