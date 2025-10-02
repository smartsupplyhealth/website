const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Supplier = require('../models/Supplier');
const jwt = require('jsonwebtoken');

async function testSupplierOrdersAPI() {
    try {
        console.log('🔄 Testing supplier orders API...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find your supplier
        const supplier = await Supplier.findOne({ email: 'essayedneder0711@gmail.com' });
        if (!supplier) {
            console.log('❌ Supplier not found');
            return;
        }

        // Generate a JWT token for the supplier
        const token = jwt.sign(
            { id: supplier._id, role: 'supplier' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log(`✅ Generated token for supplier: ${supplier.name}`);

        // Test the API endpoint
        const fetch = require('node-fetch');
        const API_URL = 'http://localhost:5000';

        const response = await fetch(`${API_URL}/api/supplier/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 API Response Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('❌ API Error:', errorText);
        }

    } catch (error) {
        console.error('❌ Error testing API:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testSupplierOrdersAPI();

