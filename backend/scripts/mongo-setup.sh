#!/bin/bash

# Script de configuration MongoDB pour SmartSupply Health

echo "🚀 Configuration de MongoDB pour SmartSupply Health..."

# Attendre que MongoDB soit prêt
until mongosh --eval "print('MongoDB is ready')" 2>/dev/null; do
  echo "⏳ Attente de MongoDB..."
  sleep 2
done

echo "✅ MongoDB est prêt!"

# Créer la base de données et l'utilisateur
mongosh --eval "
  use smartsupply;
  
  // Créer l'utilisateur de l'application
  db.createUser({
    user: 'smartsupply_user',
    pwd: 'smartsupply_password',
    roles: [
      {
        role: 'readWrite',
        db: 'smartsupply'
      }
    ]
  });
  
  // Créer les collections avec validation
  db.createCollection('users', {
    validator: {
      \$jsonSchema: {
        bsonType: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\$'
          },
          role: {
            bsonType: 'string',
            enum: ['client', 'supplier', 'admin']
          }
        }
      }
    }
  });
  
  db.createCollection('products');
  db.createCollection('orders');
  db.createCollection('suppliers');
  db.createCollection('clients');
  db.createCollection('notifications');
  
  // Créer des index pour optimiser les performances
  db.users.createIndex({ email: 1 }, { unique: true });
  db.products.createIndex({ name: 'text', description: 'text' });
  db.orders.createIndex({ orderNumber: 1 }, { unique: true });
  db.orders.createIndex({ clientId: 1, createdAt: -1 });
  db.suppliers.createIndex({ name: 1 });
  
  print('✅ Base de données SmartSupply configurée avec succès!');
"

echo "🎉 Configuration MongoDB terminée!"
