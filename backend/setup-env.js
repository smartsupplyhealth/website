#!/usr/bin/env node

/**
 * SmartSupply Health - Environment Setup Script
 * This script helps set up the environment variables for the application
 */

const fs = require('fs');
const path = require('path');

const envContent = `# SmartSupply Health - Environment Configuration
# Copy this file to .env and fill in your actual values

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smartsupply-health
# For production, use: mongodb+srv://username:password@cluster.mongodb.net/smartsupply-health

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
EMAIL_FROM=noreply@smartsupply-health.com

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# AI Configuration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Search Configuration (Optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id_here

# Crypto Payment Configuration (Optional)
CRYPTO_PAYMENT_ENABLED=true
CRYPTO_WALLET_ADDRESS=your_crypto_wallet_address_here

# Stock Release Service Configuration
UNPAID_ORDER_EXPIRATION_MINUTES=30

# Notification Configuration
NOTIFICATION_SERVICE_ENABLED=true
`;

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

console.log('🚀 Setting up SmartSupply Health environment...\n');

// Create .env file if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default configuration');
} else {
  console.log('⚠️  .env file already exists, skipping creation');
}

// Update env.example file
fs.writeFileSync(envExamplePath, envContent);
console.log('✅ Updated env.example file');

console.log('\n📋 Next steps:');
console.log('1. Edit the .env file with your actual API keys and configuration');
console.log('2. Make sure to never commit the .env file to version control');
console.log('3. Use env.example as a template for other environments');
console.log('\n🔑 Required API keys:');
console.log('- MongoDB connection string');
console.log('- JWT secret key');
console.log('- SendGrid API key (for emails)');
console.log('- Stripe API keys (for payments)');
console.log('- Google Gemini API key (for AI chatbot)');
console.log('\n✨ Environment setup complete!');
