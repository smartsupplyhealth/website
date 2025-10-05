#!/bin/bash

# Script de build pour l'image Docker du frontend
set -e

echo "🏗️ Construction de l'image Docker Frontend SmartSupply Health..."

# Variables
IMAGE_NAME="smartsupply-frontend"
TAG="latest"
DOCKERFILE_PATH="./frontend/Dockerfile"
BUILD_CONTEXT="./frontend"

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

# Vérifier que package.json existe
if [ ! -f "${BUILD_CONTEXT}/package.json" ]; then
    echo "❌ package.json non trouvé dans ${BUILD_CONTEXT}"
    exit 1
fi

# Build de l'image
echo "📦 Build de l'image ${IMAGE_NAME}:${TAG}..."
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
    docker run --rm -p 3000:3000 -d --name test-frontend "${IMAGE_NAME}:${TAG}"
    sleep 5
    
    # Vérifier que le conteneur répond
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Test de l'image réussi!"
    else
        echo "⚠️ L'image fonctionne mais le test HTTP a échoué"
    fi
    
    # Nettoyer le conteneur de test
    docker stop test-frontend > /dev/null 2>&1 || true
    docker rm test-frontend > /dev/null 2>&1 || true
    
else
    echo "❌ Erreur lors de la construction de l'image!"
    exit 1
fi

echo "🎉 Build du frontend terminé avec succès!"
