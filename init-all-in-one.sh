#!/bin/sh

# Script d'initialisation pour le conteneur All-in-One
set -e

echo "🚀 Démarrage de SmartSupply Health All-in-One Container"
echo "======================================================"

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des services..."
    supervisorctl stop all
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGTERM SIGINT

# Attendre que MongoDB soit prêt
echo "⏳ Attente de MongoDB..."
while ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo "⏳ MongoDB n'est pas encore prêt, attente..."
    sleep 2
done
echo "✅ MongoDB est prêt!"

# Initialiser la base de données si nécessaire
echo "🗄️ Initialisation de la base de données..."
mongosh smartsupply --eval "
    if (db.getCollectionNames().length === 0) {
        print('📝 Création des collections initiales...');
        db.createCollection('users');
        db.createCollection('products');
        db.createCollection('orders');
        db.createCollection('suppliers');
        db.createCollection('clients');
        print('✅ Collections créées avec succès!');
    } else {
        print('✅ Base de données déjà initialisée');
    }
" > /dev/null 2>&1 || echo "⚠️ Erreur lors de l'initialisation de la base de données"

# Démarrer tous les services avec Supervisor
echo "🔄 Démarrage des services avec Supervisor..."
supervisord -c /etc/supervisor/conf.d/supervisord.conf

# Attendre que tous les services soient prêts
echo "⏳ Attente que tous les services soient prêts..."
sleep 10

# Vérifier le statut des services
echo "📊 Statut des services:"
supervisorctl status

# Afficher les informations de connexion
echo ""
echo "🌐 Services disponibles:"
echo "======================="
echo "• Frontend: http://localhost/"
echo "• Backend API: http://localhost/api/"
echo "• Backend Direct: http://localhost:5000/"
echo "• MongoDB: localhost:27017"
echo "• Health Check: http://localhost/health"
echo ""

# Afficher les logs en temps réel
echo "📋 Logs des services (Ctrl+C pour arrêter):"
echo "==========================================="
supervisorctl tail -f all
