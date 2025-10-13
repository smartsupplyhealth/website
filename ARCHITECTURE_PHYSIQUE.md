# Architecture Physique - SmartSupply Health avec Intégration n8n

## 🏗️ Vue d'ensemble de l'Architecture

### Architecture Physique (Docker)

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                Docker Network                           │   │
│  │              (smartsupply-network)                     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Frontend  │  │   Backend   │  │   MongoDB   │     │   │
│  │  │  (React)    │  │  (Node.js)  │  │  (7.0)     │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │ Port: 3000  │  │ Port: 5000  │  │ Port: 27017│     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Intégration n8n (Externe)

```
┌─────────────────────────────────────────────────────────────────┐
│                    n8n INSTANCE                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              n8n Workflows                              │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │         HTTP Request Node                       │   │   │
│  │  │  POST http://localhost:5000/api/n8n/create     │   │   │
│  │  │  POST http://localhost:5000/api/n8n/reject     │   │   │
│  │  │  POST http://localhost:5000/api/n8n/update-stock│   │   │
│  │  │  POST http://localhost:5000/api/n8n/daily-consumption│   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Composants Principaux

### 1. Frontend (React)
- **Conteneur**: `smartsupply-frontend`
- **Image**: `neder5/smarthealth-frontend:final1am`
- **Port**: 3000
- **Technologies**:
  - React 18.2.0
  - Axios pour les appels API
  - Stripe React pour les paiements
  - Recharts pour les graphiques
  - React Router pour la navigation

### 2. Backend (Node.js/Express)
- **Conteneur**: `smartsupply-backend`
- **Image**: `neder5/smarthealth-backend:final1am`
- **Port**: 5000
- **Technologies**:
  - Node.js avec Express
  - Mongoose pour MongoDB
  - JWT pour l'authentification
  - Stripe pour les paiements
  - SendGrid pour les emails
  - Google Gemini AI pour le chatbot

### 3. Base de Données (MongoDB)
- **Conteneur**: `smartsupply-mongodb`
- **Image**: `mongo:7.0`
- **Port**: 27017
- **Configuration**:
  - Utilisateur: admin
  - Mot de passe: password123
  - Base de données: testneder

## 🔗 Intégration n8n

### API Endpoints n8n

#### 1. POST `/api/n8n/create`
- **Fonction**: Création de commandes automatiques
- **Formats supportés**:
  ```json
  // Format simple
  { "clientId": "...", "productId": "...", "quantity": 2 }
  
  // Format produit unique
  { "clientId": "...", "products": { "productId": "...", "quantity": 2 } }
  
  // Format produits multiples
  { "clientId": "...", "products": [{ "productId": "...", "quantity": 2 }] }
  ```

#### 2. POST `/api/n8n/reject`
- **Fonction**: Rejet de commandes automatiques
- **Paramètres**: `clientId`, `productId`, `quantity`, `reason`

#### 3. POST `/api/n8n/update-stock`
- **Fonction**: Mise à jour du stock client
- **Opérations**: `set`, `add`, `subtract`
- **Paramètres**: `clientId`, `productId`, `newStock`, `operation`

#### 4. POST `/api/n8n/daily-consumption`
- **Fonction**: Décrementation quotidienne du stock
- **Processus**: Consommation automatique basée sur `dailyUsage`

## 🗄️ Modèles de Données

### Modèles Principaux

#### Client
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  address: String,
  stripeCustomerId: String,
  // ... autres champs
}
```

#### Product
```javascript
{
  _id: ObjectId,
  name: String,
  price: Number,
  stock: Number,
  category: String,
  // ... autres champs
}
```

#### Order
```javascript
{
  _id: ObjectId,
  orderNumber: String,
  client: ObjectId,
  items: [{
    product: ObjectId,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  totalAmount: Number,
  mode: String, // 'manuelle', 'auto', 'manual'
  status: String,
  paymentStatus: String,
  paymentDetails: Object
}
```

#### ClientInventory
```javascript
{
  _id: ObjectId,
  client: ObjectId,
  product: ObjectId,
  currentStock: Number,
  dailyUsage: Number,
  reorderPoint: Number,
  reorderQty: Number,
  autoOrder: {
    enabled: Boolean,
    // ... autres champs
  }
}
```

## 🛠️ Services Backend

### Services d'Automatisation
- **autoOrderService.js**: Gestion des commandes automatiques
- **stockReleaseService.js**: Libération de stock
- **notificationService.js**: Système de notifications

### Services de Paiement
- **paymentService.js**: Intégration Stripe complète
- Support crypto-paiements (Coinbase Commerce)

### Services IA
- **chatbotService.js**: Chatbot avec Google Gemini AI
- **embeddingService.js**: Embeddings pour recommandations

## 🔐 Sécurité et Robustesse

### Protection n8n
- **Verrous anti-doublons**: Par client + hash des produits
- **Idempotence Stripe**: Clés uniques `n8n-auto-{orderNumber}`
- **Anti-doublon DB**: Protection 10 secondes
- **Validation stricte**: Tous les paramètres requis

### Gestion des Paiements
- **Stripe off-session**: Paiements automatiques sans interaction
- **Fallback**: Paiement manuel si échec automatique
- **Métadonnées**: Traçabilité complète des transactions

## 🐳 Configuration Docker

### docker-compose.yml
```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: smartsupply-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: testneder
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    image: neder5/smarthealth-backend:final1am
    container_name: smartsupply-backend
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/testneder?authSource=admin
      STRIPE_SECRET_KEY: sk_test_...
      SENDGRID_API_KEY: SG...
      GEMINI_API_KEY: AIzaSy...
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    image: neder5/smarthealth-frontend:final1am
    container_name: smartsupply-frontend
    environment:
      REACT_APP_API_URL: http://localhost:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongodb_data:
  backend_uploads:

networks:
  smartsupply-network:
    driver: bridge
```

## 🔄 Flux de Données

### Flux Principal
```
Utilisateur → Frontend → Backend API → MongoDB
     ↓           ↓           ↓
  Interface → Validation → Processing
     ↓           ↓           ↓
  Actions   →  Business   →  Storage
```

### Flux n8n
```
n8n Workflow → HTTP Request → Backend API → MongoDB
     ↓              ↓              ↓
  Triggers    →  Validation  →  Processing
     ↓              ↓              ↓
  Scheduling  →  Stripe API  →  Notifications
```

### Flux de Paiement Automatique
```
n8n → /api/n8n/create → Validation → Stripe off-session → Order Creation
 ↓         ↓              ↓              ↓                    ↓
Trigger → Client Check → Payment → Success/Failure → Database
```

## 📊 Monitoring et Logs

### Health Checks
- **Backend**: `GET /health` et `GET /api/health`
- **MongoDB**: Connexion automatique avec retry
- **Frontend**: Vérification de l'API backend

### Logs Importants
- Création de commandes automatiques
- Erreurs de paiement Stripe
- Mise à jour des stocks
- Notifications envoyées

## 🚀 Déploiement

### Commandes de Démarrage
```bash
# Démarrage simple
start-simple.bat

# Démarrage Docker
start-docker.bat

# Build et déploiement
docker-compose up -d
```

### Variables d'Environnement
- **Backend**: Configuration complète dans docker-compose.yml
- **Frontend**: REACT_APP_API_URL pour l'API backend
- **MongoDB**: Credentials et base de données

## 📈 Scalabilité

### Points d'Extension
- **Load Balancer**: Pour le backend en production
- **MongoDB Replica Set**: Pour la haute disponibilité
- **Redis**: Pour le cache et les sessions
- **n8n Clustering**: Pour l'automatisation distribuée

### Optimisations Possibles
- **CDN**: Pour les assets frontend
- **Database Indexing**: Pour les requêtes fréquentes
- **API Rate Limiting**: Pour la protection
- **Monitoring**: Prometheus + Grafana

---

*Architecture mise à jour le: $(date)*
*Version: 1.0*
*Projet: SmartSupply Health avec Intégration n8n*









