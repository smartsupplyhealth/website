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

// Create test coupon
const createTestCoupon = async () => {
    try {
        // Check if test coupon already exists
        const existingCoupon = await Coupon.findOne({ code: 'TEST10' });
        if (existingCoupon) {
            console.log('⚠️  Test coupon already exists:', existingCoupon);
            return;
        }

        // Create new test coupon
        const testCoupon = new Coupon({
            code: 'TEST10',
            description: 'Test coupon for 10% discount',
            type: 'percentage',
            value: 10,
            minOrderAmount: 0,
            maxDiscountAmount: 50,
            usageLimit: 100,
            usedCount: 0,
            isActive: true,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            applicableProducts: [] // Empty means applies to all products
        });

        await testCoupon.save();
        console.log('✅ Test coupon created successfully:');
        console.log('   Code: TEST10');
        console.log('   Description: Test coupon for 10% discount');
        console.log('   Discount: 10% off (max €50)');
        console.log('   Usage Limit: 100 times');
        console.log('   Valid for: 30 days');
        console.log('');
        console.log('🎯 You can now test the coupon by entering "TEST10" in the payment modal!');

    } catch (error) {
        console.error('❌ Error creating test coupon:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await createTestCoupon();
    await mongoose.connection.close();
    console.log('✅ Script completed');
};

main().catch(console.error);