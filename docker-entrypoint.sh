#!/bin/sh

echo "🚀 Démarrage de SmartSupply Health..."

# Démarrer le backend en arrière-plan
echo "📡 Démarrage du backend..."
cd /app/backend
npm start &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 10

# Démarrer le frontend
echo "🎨 Démarrage du frontend..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGTERM SIGINT

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID
