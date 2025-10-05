# 🚀 Configuration CI/CD avec Jenkins

Ce document explique comment configurer et utiliser le pipeline CI/CD pour SmartSupply Health.

## 📋 Prérequis

### 1. Jenkins Server
- Jenkins 2.400+ installé
- Plugins requis :
  - Pipeline
  - Git
  - Docker
  - NodeJS
  - GitHub Integration

### 2. Docker
- Docker Engine 20.10+
- Docker Compose 2.0+

### 3. Node.js
- Node.js 18+
- npm 8+

## 🔧 Configuration Jenkins

### 1. Créer un nouveau job Pipeline
```bash
# Via l'interface Jenkins
1. New Item → Pipeline
2. Nom: "SmartSupply-Health-CI-CD"
3. Pipeline → Definition: Pipeline script from SCM
4. SCM: Git
5. Repository URL: https://github.com/smartsupplyhealth/website.git
6. Branch: */main
7. Script Path: Jenkinsfile
```

### 2. Configurer les credentials
```bash
# Dans Jenkins → Manage Jenkins → Credentials
1. Ajouter les credentials GitHub
2. Ajouter les credentials Docker Hub (si nécessaire)
3. Configurer les variables d'environnement
```

### 3. Variables d'environnement
```bash
# Dans Jenkins → Configure → Environment variables
NODE_VERSION=18
DOCKER_REGISTRY=your-registry.com
MONGODB_URI=mongodb://admin:password123@mongodb:27017/smartsupply
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key
```

## 🐳 Déploiement Docker

### 1. Build et test local
```bash
# Build des images
docker build -t smartsupply-health:latest .
docker build -f Dockerfile.frontend -t smartsupply-frontend:latest .

# Test avec docker-compose
docker-compose up -d
```

### 2. Déploiement en production
```bash
# Déploiement complet
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérification des services
docker-compose ps
docker-compose logs -f
```

## 📊 Pipeline Stages

### 1. **Checkout** 
- Récupération du code source depuis Git

### 2. **Install Dependencies**
- Installation des dépendances backend et frontend en parallèle

### 3. **Lint & Code Quality**
- Vérification de la qualité du code
- Tests de linting

### 4. **Build**
- Build du backend et frontend
- Génération des assets de production

### 5. **Test**
- Exécution des tests unitaires
- Génération des rapports de couverture

### 6. **Security Scan**
- Audit npm pour les vulnérabilités
- Scan de sécurité

### 7. **Deploy to Staging**
- Déploiement automatique en environnement de staging
- Tests d'intégration

### 8. **Deploy to Production**
- Déploiement en production (après validation)
- Mise à jour des services

## 🔄 Webhooks GitHub

### Configuration du webhook
```bash
# URL du webhook Jenkins
https://your-jenkins-server.com/github-webhook/

# Événements déclencheurs
- push
- pull_request
- release
```

## 📈 Monitoring

### 1. Logs Jenkins
```bash
# Accès aux logs
Jenkins → Job → Build → Console Output
```

### 2. Logs Docker
```bash
# Logs des conteneurs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 3. Métriques
- Temps de build
- Taux de succès
- Couverture de tests
- Vulnérabilités détectées

## 🛠️ Commandes utiles

### Jenkins CLI
```bash
# Lancer un build
java -jar jenkins-cli.jar -s http://localhost:8080 build SmartSupply-Health-CI-CD

# Obtenir le statut
java -jar jenkins-cli.jar -s http://localhost:8080 get-job SmartSupply-Health-CI-CD
```

### Docker
```bash
# Nettoyage
docker system prune -a

# Backup
docker-compose exec mongodb mongodump --out /backup

# Restore
docker-compose exec mongodb mongorestore /backup
```

## 🚨 Dépannage

### Problèmes courants

1. **Build échoue sur les tests**
   - Vérifier la configuration des tests
   - Ajuster les seuils de couverture

2. **Déploiement Docker échoue**
   - Vérifier les credentials Docker
   - Contrôler les ressources disponibles

3. **Webhook ne fonctionne pas**
   - Vérifier l'URL du webhook
   - Contrôler les permissions GitHub

### Logs de debug
```bash
# Jenkins
tail -f /var/log/jenkins/jenkins.log

# Docker
docker-compose logs --tail=100 -f
```

## 📞 Support

Pour toute question ou problème :
- Consulter les logs Jenkins
- Vérifier la documentation Docker
- Contacter l'équipe DevOps

---

**Note**: Cette configuration est un exemple. Adaptez-la selon vos besoins spécifiques.
