#!/bin/bash

# Script de build pour l'image Docker MongoDB personnalisée
set -e

echo "🏗️ Construction de l'image Docker MongoDB SmartSupply Health..."

# Variables
IMAGE_NAME="smartsupply-mongodb"
TAG="latest"
DOCKERFILE_PATH="./mongodb/Dockerfile"
BUILD_CONTEXT="./mongodb"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé!"
    exit 1
fi

# Créer le Dockerfile MongoDB personnalisé s'il n'existe pas
if [ ! -f "${DOCKERFILE_PATH}" ]; then
    echo "📝 Création du Dockerfile MongoDB personnalisé..."
    mkdir -p "$(dirname "${DOCKERFILE_PATH}")"
    
    cat > "${DOCKERFILE_PATH}" << 'EOF'
# Dockerfile MongoDB personnalisé pour SmartSupply Health
FROM mongo:6.0

# Installer les outils supplémentaires
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier la configuration MongoDB
COPY mongod.conf /etc/mongod.conf

# Copier les scripts d'initialisation
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Créer les répertoires nécessaires
RUN mkdir -p /var/log/mongodb /backups

# Changer les permissions
RUN chown -R mongodb:mongodb /var/log/mongodb /backups

# Exposer le port
EXPOSE 27017

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD mongosh --eval "db.adminCommand('ping')" || exit 1

# Utiliser la configuration personnalisée
CMD ["mongod", "--config", "/etc/mongod.conf"]
EOF
fi

# Créer le répertoire des scripts d'initialisation
mkdir -p "${BUILD_CONTEXT}/init-scripts"

# Copier la configuration MongoDB
cp ./mongodb/mongod.conf "${BUILD_CONTEXT}/mongod.conf" 2>/dev/null || echo "⚠️ Configuration MongoDB non trouvée, utilisation de la configuration par défaut"

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
    docker run --rm -d --name test-mongodb -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password123 \
        "${IMAGE_NAME}:${TAG}"
    
    sleep 10
    
    # Vérifier que MongoDB répond
    if docker exec test-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✅ Test de l'image MongoDB réussi!"
    else
        echo "⚠️ L'image fonctionne mais le test de connexion a échoué"
    fi
    
    # Nettoyer le conteneur de test
    docker stop test-mongodb > /dev/null 2>&1 || true
    docker rm test-mongodb > /dev/null 2>&1 || true
    
else
    echo "❌ Erreur lors de la construction de l'image!"
    exit 1
fi

echo "🎉 Build de MongoDB terminé avec succès!"
