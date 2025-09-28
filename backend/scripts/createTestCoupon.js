const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
require('dotenv').config();

async function createTestCoupon() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a test coupon
        const testCoupon = new Coupon({
            code: 'WELCOME10',
            description: 'Welcome discount - 10% off your first order',
            type: 'percentage',
            value: 10,
            minOrderAmount: 50, // Minimum €50 order
            maxDiscountAmount: 25, // Maximum €25 discount
            usageLimit: 100, // Can be used 100 times
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days validity
            isActive: true
        });

        await testCoupon.save();
        console.log('✅ Test coupon created successfully!');
        console.log('Coupon Details:');
        console.log(`  Code: ${testCoupon.code}`);
        console.log(`  Description: ${testCoupon.description}`);
        console.log(`  Type: ${testCoupon.type}`);
        console.log(`  Value: ${testCoupon.value}${testCoupon.type === 'percentage' ? '%' : '€'}`);
        console.log(`  Min Order Amount: €${testCoupon.minOrderAmount}`);
        console.log(`  Max Discount: €${testCoupon.maxDiscountAmount}`);
        console.log(`  Usage Limit: ${testCoupon.usageLimit} times`);
        console.log(`  Valid Until: ${testCoupon.validUntil.toLocaleDateString()}`);

        // Create another test coupon
        const fixedCoupon = new Coupon({
            code: 'SAVE20',
            description: 'Save €20 on orders over €100',
            type: 'fixed',
            value: 20,
            minOrderAmount: 100,
            usageLimit: 50,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days validity
            isActive: true
        });

        await fixedCoupon.save();
        console.log('\n✅ Fixed amount coupon created successfully!');
        console.log('Coupon Details:');
        console.log(`  Code: ${fixedCoupon.code}`);
        console.log(`  Description: ${fixedCoupon.description}`);
        console.log(`  Type: ${fixedCoupon.type}`);
        console.log(`  Value: €${fixedCoupon.value}`);
        console.log(`  Min Order Amount: €${fixedCoupon.minOrderAmount}`);
        console.log(`  Usage Limit: ${fixedCoupon.usageLimit} times`);
        console.log(`  Valid Until: ${fixedCoupon.validUntil.toLocaleDateString()}`);

        // List all coupons
        const allCoupons = await Coupon.find({ isActive: true });
        console.log(`\n📋 Total active coupons: ${allCoupons.length}`);

        allCoupons.forEach((coupon, index) => {
            console.log(`\n${index + 1}. ${coupon.code} - ${coupon.description}`);
            console.log(`   Type: ${coupon.type}, Value: ${coupon.value}${coupon.type === 'percentage' ? '%' : '€'}`);
            console.log(`   Min Order: €${coupon.minOrderAmount}, Usage: ${coupon.usedCount}/${coupon.usageLimit}`);
        });

    } catch (error) {
        console.error('Error creating test coupon:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

createTestCoupon();

