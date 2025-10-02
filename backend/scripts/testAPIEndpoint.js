const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PaymentMethod = require('../models/PaymentMethod');
const Client = require('../models/Client');
const { auth } = require('../middleware/auth');
require('dotenv').config();

async function testAPIEndpoint() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a simple test server
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Mock the auth middleware for testing
        app.use((req, res, next) => {
            // Mock user ID for testing
            req.user = { id: '68d92ce9f240f3b445b64dc5' }; // Use a real client ID
            next();
        });

        // Test the detachPaymentMethod function
        const detachPaymentMethod = async (req, res) => {
            const { paymentMethodId } = req.params;
            try {
                // Find the payment method in our local database
                const paymentMethod = await PaymentMethod.findOne({
                    _id: paymentMethodId,
                    client: req.user.id,
                    isActive: true
                });

                if (!paymentMethod) {
                    return res.status(404).json({
                        success: false,
                        message: 'Payment method not found'
                    });
                }

                // Mark as inactive in our local database instead of deleting
                paymentMethod.isActive = false;
                await paymentMethod.save();

                res.json({
                    success: true,
                    message: 'Payment method deleted successfully'
                });
            } catch (error) {
                console.error('Error detaching payment method:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server error'
                });
            }
        };

        // Test the endpoint
        app.delete('/test-payment-methods/:paymentMethodId', detachPaymentMethod);

        // Start the test server
        const server = app.listen(3001, () => {
            console.log('Test server running on port 3001');
        });

        // Test the endpoint
        const testId = '68d92ce9f240f3b445b64dc5'; // Use a real payment method ID
        console.log('Testing deletion with ID:', testId);

        // Make a test request
        const fetch = require('node-fetch');
        const response = await fetch(`http://localhost:3001/test-payment-methods/${testId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', result);

        // Close the server
        server.close();
        await mongoose.disconnect();
        console.log('Test completed');

    } catch (error) {
        console.error('❌ Error testing API endpoint:', error);
    }
}

testAPIEndpoint();






