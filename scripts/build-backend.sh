#!/bin/bash

# Script de build pour l'image Docker du backend
set -e

echo "🏗️ Construction de l'image Docker Backend SmartSupply Health..."

# Variables
IMAGE_NAME="smartsupply-backend"
TAG="latest"
DOCKERFILE_PATH="./backend/Dockerfile"
BUILD_CONTEXT="./backend"

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
    docker run --rm "${IMAGE_NAME}:${TAG}" node --version
    
else
    echo "❌ Erreur lors de la construction de l'image!"
    exit 1
fi

echo "🎉 Build du backend terminé avec succès!"
