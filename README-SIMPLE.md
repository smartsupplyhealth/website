# SmartSupply-Health - Configuration Simple

## 🎯 Configuration unifiée

Cette configuration simple utilise les ports standards :

- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:5000
- **MongoDB** : localhost:27017

## 🚀 Démarrage rapide

### Option 1 : Script automatique (Recommandé)
```bash
# Windows Batch
start-simple.bat

# Windows PowerShell
.\start-simple.ps1
```

### Option 2 : Démarrage manuel

1. **Démarrer MongoDB** :
   ```bash
   mongod --dbpath C:\data\db
   ```

2. **Démarrer le Backend** :
   ```bash
   cd backend
   npm start
   ```

3. **Démarrer le Frontend** (dans un nouveau terminal) :
   ```bash
   cd frontend
   npm start
   ```

## 📁 Structure des ports

```
localhost:3000  → Frontend React
localhost:5000  → Backend Node.js/Express
localhost:27017 → MongoDB
```

## 🔧 Configuration

Le fichier `config-simple.env` contient toute la configuration nécessaire. Copiez-le vers :
- `backend/.env`
- `frontend/.env` (si nécessaire)

## ✅ Vérification

Une fois démarré, vous devriez voir :
- Frontend accessible sur http://localhost:3000
- Backend API accessible sur http://localhost:5000
- Base de données MongoDB connectée

## 🛠️ Dépannage

Si un port est occupé :
1. Fermez l'application qui utilise le port
2. Ou changez le port dans le fichier de configuration
3. Redémarrez l'application

## 📝 Notes

- Cette configuration est pour le développement local
- Pas de Docker, pas de nginx - configuration simple
- Tous les services tournent directement sur votre machine















