# 🚀 SmartSupply Health - Conteneur All-in-One

Ce conteneur Docker unique contient tous les services nécessaires pour faire fonctionner SmartSupply Health :
- **Backend** (Node.js/Express)
- **Frontend** (React)
- **MongoDB** (Base de données)
- **Nginx** (Reverse proxy)

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- 2GB de RAM minimum
- 5GB d'espace disque

## 🏗️ Construction de l'image

### Méthode 1: Script automatique
```bash
./scripts/build-all-in-one.sh
```

### Méthode 2: Commande Docker
```bash
docker build -t smartsupply-all-in-one:latest -f Dockerfile.all-in-one .
```

## 🚀 Démarrage

### Méthode 1: Script automatique
```bash
./scripts/run-all-in-one.sh
```

### Méthode 2: Docker Compose
```bash
docker-compose -f docker-compose.all-in-one.yml up -d
```

### Méthode 3: Commande Docker directe
```bash
docker run -d \
  --name smartsupply-all-in-one \
  -p 80:80 \
  -p 3000:3000 \
  -p 5000:5000 \
  -p 27017:27017 \
  -v smartsupply_data:/var/lib/mongodb \
  -v smartsupply_logs:/var/log \
  -v smartsupply_uploads:/app/backend/uploads \
  smartsupply-all-in-one:latest
```

## 🌐 Accès aux services

Une fois démarré, vous pouvez accéder à :

- **Frontend** : http://localhost/
- **API Backend** : http://localhost/api/
- **Backend Direct** : http://localhost:5000/
- **Health Check** : http://localhost/health
- **MongoDB** : localhost:27017

## 📊 Monitoring

### Vérifier le statut des services
```bash
docker exec -it smartsupply-all-in-one supervisorctl status
```

### Voir les logs
```bash
# Tous les logs
docker-compose -f docker-compose.all-in-one.yml logs -f

# Logs spécifiques
docker exec -it smartsupply-all-in-one supervisorctl tail -f backend
docker exec -it smartsupply-all-in-one supervisorctl tail -f nginx
docker exec -it smartsupply-all-in-one supervisorctl tail -f mongodb
```

### Accéder au conteneur
```bash
docker exec -it smartsupply-all-in-one sh
```

## 🔧 Configuration

### Variables d'environnement
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartsupply
JWT_SECRET=your-jwt-secret-here
STRIPE_SECRET_KEY=your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
REACT_APP_API_URL=http://localhost:5000
```

### Volumes persistants
- `smartsupply_data` : Données MongoDB
- `smartsupply_logs` : Logs de tous les services
- `smartsupply_uploads` : Fichiers uploadés

## 🛠️ Maintenance

### Sauvegarde MongoDB
```bash
docker exec smartsupply-all-in-one mongodump --out /backup
docker cp smartsupply-all-in-one:/backup ./backup-$(date +%Y%m%d)
```

### Restauration MongoDB
```bash
docker cp ./backup-20231201 smartsupply-all-in-one:/restore
docker exec smartsupply-all-in-one mongorestore /restore
```

### Mise à jour de l'application
```bash
# Arrêter le conteneur
docker-compose -f docker-compose.all-in-one.yml down

# Reconstruire l'image
./scripts/build-all-in-one.sh

# Redémarrer
./scripts/run-all-in-one.sh
```

## 🔍 Dépannage

### Le conteneur ne démarre pas
```bash
# Vérifier les logs
docker logs smartsupply-all-in-one

# Vérifier les ressources
docker stats smartsupply-all-in-one
```

### Services non accessibles
```bash
# Vérifier le statut des services
docker exec -it smartsupply-all-in-one supervisorctl status

# Redémarrer un service
docker exec -it smartsupply-all-in-one supervisorctl restart backend
```

### Problèmes de base de données
```bash
# Vérifier MongoDB
docker exec -it smartsupply-all-in-one mongosh --eval "db.adminCommand('ping')"

# Voir les logs MongoDB
docker exec -it smartsupply-all-in-one supervisorctl tail -f mongodb
```

## 📈 Performance

### Ressources recommandées
- **CPU** : 2 cores minimum
- **RAM** : 2GB minimum (4GB recommandé)
- **Stockage** : 10GB minimum

### Optimisations
- L'image utilise des optimisations pour la production
- Compression gzip activée
- Cache des assets statiques
- Configuration MongoDB optimisée

## 🔒 Sécurité

- Utilisateur non-root dans le conteneur
- MongoDB configuré pour l'environnement conteneurisé
- Nginx avec headers de sécurité
- Variables d'environnement pour les secrets

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker logs smartsupply-all-in-one`
2. Vérifiez le statut : `docker exec -it smartsupply-all-in-one supervisorctl status`
3. Consultez la documentation Docker
4. Contactez l'équipe de développement

---

**Note** : Ce conteneur All-in-One est idéal pour le développement, les tests et les déploiements simples. Pour la production à grande échelle, considérez l'utilisation de conteneurs séparés.
