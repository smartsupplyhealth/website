#!/bin/bash

# Script de backup automatique pour MongoDB
set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="smartsupply_backup_${DATE}"
RETENTION_DAYS=30

echo "🔄 Début du backup MongoDB - $(date)"

# Créer le répertoire de backup s'il n'existe pas
mkdir -p ${BACKUP_DIR}

# Effectuer le backup
echo "📦 Création du backup: ${BACKUP_NAME}"
mongodump \
  --uri="${MONGO_URI}" \
  --out="${BACKUP_DIR}/${BACKUP_NAME}" \
  --gzip

# Compresser le backup
echo "🗜️ Compression du backup..."
cd ${BACKUP_DIR}
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Nettoyer les anciens backups
echo "🧹 Nettoyage des anciens backups (plus de ${RETENTION_DAYS} jours)..."
find ${BACKUP_DIR} -name "smartsupply_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Afficher la taille du backup
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "✅ Backup terminé: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Lister les backups disponibles
echo "📋 Backups disponibles:"
ls -lh ${BACKUP_DIR}/smartsupply_backup_*.tar.gz 2>/dev/null || echo "Aucun backup trouvé"

echo "🎉 Backup MongoDB terminé avec succès - $(date)"
