# Dockerfile pour SmartSupply Health
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Installer les dépendances
RUN npm install
RUN cd backend && npm install --legacy-peer-deps
RUN cd frontend && npm install

# Copier le code source
COPY . .

# Build du frontend
RUN cd frontend && npm run build

# Exposer les ports
EXPOSE 3000 5000

# Script de démarrage
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
