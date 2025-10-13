# SmartSupply-Health - Docker Simple

## 🐳 Configuration Docker unifiée

Cette configuration utilise **uniquement** vos 3 images Docker reconstruites :

- `neder5/smarthealth-mongodb:final1am` (SHA: 1cd689eda63a)
- `neder5/smarthealth-backend:final1am` (SHA: 2324b9445ded)
- `neder5/smarthealth-frontend:final1am` (SHA: a32fa34207fe)

## 🚀 Démarrage rapide

### Option 1 : Script automatique
```bash
# Windows Batch
start-docker.bat

# Windows PowerShell
.\start-docker.ps1
```

### Option 2 : Commandes Docker
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down
```

## 📊 Ports

- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:5000
- **MongoDB** : localhost:27017

## 🔧 Configuration

Le fichier `docker-compose.yml` contient :
- **MongoDB** : Base de données avec authentification
- **Backend** : API Node.js/Express
- **Frontend** : Interface React

## 📝 Commandes utiles

```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs d'un service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Redémarrer un service
docker-compose restart backend

# Supprimer tout (données incluses)
docker-compose down -v
```

## ✅ Avantages

- **Simple** : Seulement 3 images
- **Rapide** : Pas de nginx ou reverse proxy
- **Direct** : Frontend → Backend directement
- **Isolé** : Chaque service dans son conteneur
