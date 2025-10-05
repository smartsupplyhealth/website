#!/bin/bash

# Script de build pour l'image Docker All-in-One
set -e

echo "🏗️ Construction de l'image Docker All-in-One SmartSupply Health..."
echo "=================================================================="

# Variables
IMAGE_NAME="smartsupply-all-in-one"
TAG="latest"
DOCKERFILE_PATH="./Dockerfile.all-in-one"
BUILD_CONTEXT="."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    exit 1
fi

# Vérifier que le Dockerfile existe
if [ ! -f "${DOCKERFILE_PATH}" ]; then
    echo "❌ Dockerfile non trouvé: ${DOCKERFILE_PATH}"
    exit 1
fi

# Vérifier que les fichiers nécessaires existent
REQUIRED_FILES=(
    "backend/package.json"
    "frontend/package.json"
    "nginx-all-in-one.conf"
    "mongodb-all-in-one.conf"
    "supervisor.conf"
    "init-all-in-one.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier requis non trouvé: $file"
        exit 1
    fi
done

echo "✅ Tous les fichiers requis sont présents"

# Build de l'image
echo "📦 Build de l'image ${IMAGE_NAME}:${TAG}..."
echo "⏳ Cela peut prendre plusieurs minutes..."

docker build \
    -t "${IMAGE_NAME}:${TAG}" \
    -f "${DOCKERFILE_PATH}" \
    "${BUILD_CONTEXT}"

# Vérifier que l'image a été créée
if docker images | grep -q "${IMAGE_NAME}"; then
    echo "✅ Image ${IMAGE_NAME}:${TAG} construite avec succès!"
    
    # Afficher les informations de l'image
    echo "📊 Informations de l'image:"
    docker images "${IMAGE_NAME}:${TAG}"
    
    # Afficher la taille de l'image
    IMAGE_SIZE=$(docker images --format "table {{.Size}}" "${IMAGE_NAME}:${TAG}" | tail -n 1)
    echo "📏 Taille de l'image: ${IMAGE_SIZE}"
    
    # Test de l'image
    echo "🧪 Test de l'image..."
    echo "⏳ Démarrage du conteneur de test..."
    
    # Démarrer le conteneur en arrière-plan
    docker run -d --name test-all-in-one -p 8080:80 "${IMAGE_NAME}:${TAG}"
    
    # Attendre que les services démarrent
    echo "⏳ Attente que les services démarrent (60 secondes)..."
    sleep 60
    
    # Vérifier que le conteneur répond
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Test de l'image réussi!"
        echo "🌐 Frontend accessible sur: http://localhost:8080/"
        echo "🔗 API accessible sur: http://localhost:8080/api/"
        echo "💚 Health check: http://localhost:8080/health"
    else
        echo "⚠️ L'image fonctionne mais le test HTTP a échoué"
        echo "📋 Vérifiez les logs avec: docker logs test-all-in-one"
    fi
    
    # Nettoyer le conteneur de test
    echo "🧹 Nettoyage du conteneur de test..."
    docker stop test-all-in-one > /dev/null 2>&1 || true
    docker rm test-all-in-one > /dev/null 2>&1 || true
    
else
    echo "❌ Erreur lors de la construction de l'image!"
    exit 1
fi

echo ""
echo "🎉 Build All-in-One terminé avec succès!"
echo ""
echo "📋 Commandes utiles:"
echo "==================="
echo "• Démarrer: docker-compose -f docker-compose.all-in-one.yml up -d"
echo "• Voir les logs: docker-compose -f docker-compose.all-in-one.yml logs -f"
echo "• Arrêter: docker-compose -f docker-compose.all-in-one.yml down"
echo "• Accéder au conteneur: docker exec -it smartsupply-all-in-one sh"
echo ""
echo "🌐 URLs d'accès:"
echo "==============="
echo "• Frontend: http://localhost/"
echo "• API: http://localhost/api/"
echo "• Health Check: http://localhost/health"
echo "• MongoDB: localhost:27017"
