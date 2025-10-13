# API n8n - Guide d'utilisation

## Endpoint: POST /api/n8n/create

Cette API permet de créer des commandes automatiques depuis n8n avec support des paiements Stripe off-session.

## Formats d'entrée supportés

### 1. Format ancien (compatibilité)
```json
{
  "clientId": "64a1b2c3d4e5f6789abcdef0",
  "productId": "64a1b2c3d4e5f6789abcdef1",
  "quantity": 2
}
```

### 2. Format produit unique (objet)
```json
{
  "clientId": "64a1b2c3d4e5f6789abcdef0",
  "products": {
    "productId": "64a1b2c3d4e5f6789abcdef1",
    "quantity": 2
  }
}
```

### 3. Format produits multiples (tableau)
```json
{
  "clientId": "64a1b2c3d4e5f6789abcdef0",
  "products": [
    { "productId": "64a1b2c3d4e5f6789abcdef1", "quantity": 2 },
    { "productId": "64a1b2c3d4e5f6789abcdef2", "quantity": 1 }
  ]
}
```

## Configuration n8n

### Node HTTP Request
- **Method**: POST
- **URL**: `http://localhost:5000/api/n8n/create`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**: JSON brut (pas de champs séparés)

### Exemple de configuration n8n
```json
{
  "method": "POST",
  "url": "http://localhost:5000/api/n8n/create",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "clientId": "{{ $json.clientId }}",
    "products": [
      { "productId": "{{ $json.productId1 }}", "quantity": {{ $json.quantity1 }} },
      { "productId": "{{ $json.productId2 }}", "quantity": {{ $json.quantity2 }} }
    ]
  }
}
```

## Gestion des paiements

### Paiement automatique (Stripe off-session)
- **Condition**: Le client doit avoir un `stripeCustomerId` et un payment method par défaut configuré dans Stripe
- **Comportement**: Paiement automatique avec `confirm: true` et `off_session: true`
- **Status**: `paymentStatus: 'Paid'`, `status: 'confirmed'`

### Paiement en attente
- **Condition**: Le client n'a pas de `stripeCustomerId` ou pas de payment method par défaut
- **Comportement**: Commande créée sans paiement
- **Status**: `paymentStatus: 'Pending'`, `status: 'pending'`

## Sécurité et robustesse

### Verrous anti-doublons
- **Niveau**: Client + hash des produits
- **Durée**: Jusqu'à la fin du traitement
- **Avantage**: Permet des commandes parallèles avec des produits différents

### Idempotence Stripe
- **Clé**: `n8n-auto-{orderNumber}`
- **Avantage**: Évite les doublons en cas de retry réseau

### Anti-doublon base de données
- **Durée**: 10 secondes
- **Critères**: Même client + mêmes produits + mode 'auto'

## Réponses API

### Succès (paiement réussi)
```json
{
  "success": true,
  "message": "Auto-order created and paid successfully",
  "order": { ... },
  "paymentIntent": { ... }
}
```

### Succès (paiement en attente)
```json
{
  "success": true,
  "message": "Auto-order created (payment pending)",
  "order": { ... },
  "paymentIntent": null
}
```

### Erreur de validation
```json
{
  "success": false,
  "message": "clientId et au moins un productId sont requis",
  "received": { ... }
}
```

### Erreur de doublon
```json
{
  "success": false,
  "message": "Duplicate auto-order detected (same client/products within 10 seconds)",
  "existingOrder": "CMD1234567890123"
}
```

### Erreur de verrou
```json
{
  "success": false,
  "message": "Auto-order request already in progress for this client with these products",
  "lockKey": "auto-64a1b2c3d4e5f6789abcdef0-abc123"
}
```

## Points d'attention

### Modèle Client
- Seul le champ `address` existe (pas de `city`, `postalCode`, `country`)
- Les champs manquants sont remplis par 'N/A'

### Modèle Order
- Tous les champs requis existent : `items[].product`, `unitPrice`, `totalPrice`, `paymentDetails`
- Le mode est défini sur 'auto' pour les commandes n8n

### Stripe
- Vérifiez que `invoice_settings.default_payment_method` est configuré pour le client
- Les montants sont convertis EUR → centimes pour Stripe
- Idempotency-Key automatique pour éviter les doublons

## Test de l'API

Utilisez le script de test :
```bash
cd backend
node scripts/testN8nAPI.js
```

N'oubliez pas de remplacer les IDs de test par de vrais IDs de votre base de données.









