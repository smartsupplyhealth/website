#!/bin/bash

# Script unifié pour construire les images Docker frontend et backend avec le même tag
set -e

echo "🚀 Construction des images Docker SmartSupply Health avec tag unifié"
echo "=================================================================="

# Variables
TAG="${1:-latest}"
FRONTEND_IMAGE="smartsupply-frontend"
BACKEND_IMAGE="smartsupply-backend"
FRONTEND_DOCKERFILE="./frontend/Dockerfile"
BACKEND_DOCKERFILE="./backend/Dockerfile"
FRONTEND_CONTEXT="./frontend"
BACKEND_CONTEXT="./backend"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    print_header "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé!"
        echo "📥 Installez Docker depuis: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose n'est pas installé (optionnel pour ce script)"
    fi
    
    # Vérifier les Dockerfiles
    if [ ! -f "${FRONTEND_DOCKERFILE}" ]; then
        print_error "Dockerfile frontend non trouvé: ${FRONTEND_DOCKERFILE}"
        exit 1
    fi
    
    if [ ! -f "${BACKEND_DOCKERFILE}" ]; then
        print_error "Dockerfile backend non trouvé: ${BACKEND_DOCKERFILE}"
        exit 1
    fi
    
    # Vérifier les contextes de build
    if [ ! -d "${FRONTEND_CONTEXT}" ]; then
        print_error "Répertoire frontend non trouvé: ${FRONTEND_CONTEXT}"
        exit 1
    fi
    
    if [ ! -d "${BACKEND_CONTEXT}" ]; then
        print_error "Répertoire backend non trouvé: ${BACKEND_CONTEXT}"
        exit 1
    fi
    
    print_success "Tous les prérequis sont satisfaits!"
    echo ""
}

# Fonction pour construire une image
build_image() {
    local image_name="$1"
    local dockerfile_path="$2"
    local build_context="$3"
    local tag="$4"
    
    print_header "Construction de l'image ${image_name}:${tag}..."
    
    # Afficher les informations de build
    echo "📦 Image: ${image_name}:${tag}"
    echo "📁 Dockerfile: ${dockerfile_path}"
    echo "📂 Contexte: ${build_context}"
    echo ""
    
    # Construire l'image
    if docker build \
        -t "${image_name}:${tag}" \
        -f "${dockerfile_path}" \
        "${build_context}"; then
        
        print_success "Image ${image_name}:${tag} construite avec succès!"
        
        # Afficher les informations de l'image
        echo "📊 Informations de l'image:"
        docker images "${image_name}:${tag}"
        
        # Afficher la taille de l'image
        local image_size=$(docker images --format "table {{.Size}}" "${image_name}:${tag}" | tail -n 1)
        echo "📏 Taille de l'image: ${image_size}"
        
        return 0
    else
        print_error "Erreur lors de la construction de l'image ${image_name}:${tag}!"
        return 1
    fi
}

# Fonction pour tester une image
test_image() {
    local image_name="$1"
    local tag="$2"
    local port="$3"
    
    print_header "Test de l'image ${image_name}:${tag}..."
    
    # Démarrer le conteneur en arrière-plan
    local container_name="test-${image_name}-${tag//[^a-zA-Z0-9]/-}"
    docker run -d --name "${container_name}" -p "${port}:${port}" "${image_name}:${tag}" > /dev/null 2>&1
    
    # Attendre que le conteneur démarre
    sleep 5
    
    # Vérifier que le conteneur fonctionne
    if docker ps | grep -q "${container_name}"; then
        print_success "Conteneur ${container_name} démarré avec succès!"
        
        # Test HTTP (si applicable)
        if [ "${image_name}" = "${FRONTEND_IMAGE}" ]; then
            if curl -f "http://localhost:${port}/" > /dev/null 2>&1; then
                print_success "Test HTTP réussi pour ${image_name}!"
            else
                print_warning "L'image fonctionne mais le test HTTP a échoué"
            fi
        fi
        
        # Nettoyer le conteneur de test
        docker stop "${container_name}" > /dev/null 2>&1 || true
        docker rm "${container_name}" > /dev/null 2>&1 || true
        
        return 0
    else
        print_error "Le conteneur ${container_name} n'a pas démarré correctement!"
        docker logs "${container_name}" 2>/dev/null || true
        docker stop "${container_name}" > /dev/null 2>&1 || true
        docker rm "${container_name}" > /dev/null 2>&1 || true
        return 1
    fi
}

# Fonction principale
main() {
    # Afficher les informations de l'environnement
    print_header "Informations de l'environnement"
    echo "🐳 Docker version: $(docker --version)"
    echo "📅 Date: $(date)"
    echo "🏷️  Tag utilisé: ${TAG}"
    echo ""
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Changer vers le répertoire du projet
    cd "$(dirname "$0")/.."
    
    # Construire le backend
    print_header "🏗️ Construction du Backend"
    if build_image "${BACKEND_IMAGE}" "${BACKEND_DOCKERFILE}" "${BACKEND_CONTEXT}" "${TAG}"; then
        print_success "Backend construit avec succès!"
    else
        print_error "Échec de la construction du backend!"
        exit 1
    fi
    echo ""
    
    # Construire le frontend
    print_header "🏗️ Construction du Frontend"
    if build_image "${FRONTEND_IMAGE}" "${FRONTEND_DOCKERFILE}" "${FRONTEND_CONTEXT}" "${TAG}"; then
        print_success "Frontend construit avec succès!"
    else
        print_error "Échec de la construction du frontend!"
        exit 1
    fi
    echo ""
    
    # Tester les images
    print_header "🧪 Test des images construites"
    
    # Test du backend
    if test_image "${BACKEND_IMAGE}" "${TAG}" "5000"; then
        print_success "Test du backend réussi!"
    else
        print_warning "Test du backend échoué, mais l'image a été construite"
    fi
    echo ""
    
    # Test du frontend
    if test_image "${FRONTEND_IMAGE}" "${TAG}" "3000"; then
        print_success "Test du frontend réussi!"
    else
        print_warning "Test du frontend échoué, mais l'image a été construite"
    fi
    echo ""
    
    # Afficher le résumé
    print_header "📊 Résumé des images construites"
    echo "======================================"
    docker images | grep -E "(${FRONTEND_IMAGE}|${BACKEND_IMAGE})" | grep "${TAG}" || echo "Aucune image trouvée"
    echo ""
    
    # Afficher les commandes utiles
    print_header "📋 Commandes utiles"
    echo "======================"
    echo "• Voir toutes les images: docker images"
    echo "• Démarrer le backend: docker run -d -p 5000:5000 --name smartsupply-backend ${BACKEND_IMAGE}:${TAG}"
    echo "• Démarrer le frontend: docker run -d -p 3000:3000 --name smartsupply-frontend ${FRONTEND_IMAGE}:${TAG}"
    echo "• Voir les logs backend: docker logs smartsupply-backend"
    echo "• Voir les logs frontend: docker logs smartsupply-frontend"
    echo "• Arrêter les conteneurs: docker stop smartsupply-backend smartsupply-frontend"
    echo "• Supprimer les conteneurs: docker rm smartsupply-backend smartsupply-frontend"
    echo ""
    
    print_success "🎉 Construction terminée avec succès!"
    print_success "Images créées: ${FRONTEND_IMAGE}:${TAG} et ${BACKEND_IMAGE}:${TAG}"
}

# Exécuter le script principal
main "$@"


