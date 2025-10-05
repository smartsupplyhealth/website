// Script d'initialisation MongoDB pour Docker
db = db.getSiblingDB('smartsupply');

// Créer un utilisateur pour l'application
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

// Créer les collections de base
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('suppliers');
db.createCollection('clients');

print('✅ Base de données SmartSupply initialisée avec succès!');
