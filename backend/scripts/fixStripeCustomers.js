const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('../models/Client');

// Initialize Stripe
let stripe;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key_here') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.error('Stripe not initialized: STRIPE_SECRET_KEY not provided');
    process.exit(1);
}

async function fixStripeCustomers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find clients without stripeCustomerId
        const clientsWithoutStripe = await Client.find({
            stripeCustomerId: { $exists: false }
        });

        console.log(`Found ${clientsWithoutStripe.length} clients without Stripe customer ID`);

        for (const client of clientsWithoutStripe) {
            try {
                console.log(`Processing client: ${client.name} (${client.email})`);

                // Create Stripe customer
                const customer = await stripe.customers.create({
                    email: client.email,
                    name: client.name,
                    description: `Client for SmartSupply-Health - ${client.clinicName}`,
                });

                // Update client with Stripe customer ID
                client.stripeCustomerId = customer.id;
                await client.save();

                console.log(`✅ Created Stripe customer for ${client.name}: ${customer.id}`);
            } catch (error) {
                console.error(`❌ Error creating Stripe customer for ${client.name}:`, error.message);
            }
        }

        console.log('✅ Finished processing all clients');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixStripeCustomers();
