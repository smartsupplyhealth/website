const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ClientInventory = require('../models/ClientInventory');

async function checkDatabase() {
    try {
        console.log('🔍 Checking current database contents...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check suppliers
        const suppliers = await Supplier.find({});
        console.log(`\n👥 Suppliers (${suppliers.length}):`);
        suppliers.forEach((supplier, index) => {
            console.log(`${index + 1}. ${supplier.name} (${supplier.email}) - Company: ${supplier.companyName}`);
        });

        // Check clients
        const clients = await Client.find({});
        console.log(`\n👤 Clients (${clients.length}):`);
        clients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.name} (${client.email}) - Clinic: ${client.clinicName || 'N/A'}`);
        });

        // Check products
        const products = await Product.find({}).populate('supplier', 'name companyName');
        console.log(`\n📦 Products (${products.length}):`);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - €${product.price} - Stock: ${product.stock}`);
            console.log(`   Supplier: ${product.supplier?.name || 'Unknown'} (${product.supplier?.companyName || 'N/A'})`);
            console.log(`   Category: ${product.category}`);
            console.log('');
        });

        // Check orders
        const orders = await Order.find({}).populate('client', 'name email');
        console.log(`\n📋 Orders (${orders.length}):`);
        orders.forEach((order, index) => {
            console.log(`${index + 1}. ${order.orderNumber} - €${order.totalAmount} - Status: ${order.status}`);
            console.log(`   Client: ${order.client?.name || 'Unknown'} (${order.client?.email || 'N/A'})`);
            console.log(`   Payment: ${order.paymentStatus}`);
            console.log('');
        });

        // Check inventory
        const inventory = await ClientInventory.find({}).populate('client', 'name').populate('product', 'name');
        console.log(`\n📊 Client Inventory (${inventory.length}):`);
        inventory.forEach((item, index) => {
            console.log(`${index + 1}. ${item.client?.name || 'Unknown'} - ${item.product?.name || 'Unknown Product'}`);
            console.log(`   Current Stock: ${item.currentStock} - Reorder Point: ${item.reorderPoint}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkDatabase();

