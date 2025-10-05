require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MongoDB URI not found in environment variables');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Create fixed discount coupon
const createFixedCoupon = async () => {
    try {
        // Check if fixed coupon already exists
        const existingCoupon = await Coupon.findOne({ code: 'SAVE20' });
        if (existingCoupon) {
            console.log('⚠️  Fixed coupon already exists:', existingCoupon);
            return;
        }

        // Create new fixed discount coupon
        const fixedCoupon = new Coupon({
            code: 'SAVE20',
            description: 'Save €20 on your order',
            type: 'fixed',
            value: 20,
            minOrderAmount: 50, // Minimum order of €50
            usageLimit: 50,
            usedCount: 0,
            isActive: true,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            applicableProducts: [] // Empty means applies to all products
        });

        await fixedCoupon.save();
        console.log('✅ Fixed discount coupon created successfully:');
        console.log('   Code: SAVE20');
        console.log('   Description: Save €20 on your order');
        console.log('   Discount: €20 off (minimum order €50)');
        console.log('   Usage Limit: 50 times');
        console.log('   Valid for: 30 days');
        console.log('');
        console.log('🎯 You can now test the coupon by entering "SAVE20" in the payment modal!');

    } catch (error) {
        console.error('❌ Error creating fixed coupon:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await createFixedCoupon();
    await mongoose.connection.close();
    console.log('✅ Script completed');
};

main().catch(console.error);




