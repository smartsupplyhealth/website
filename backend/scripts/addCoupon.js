const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
require('dotenv').config();

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
    console.log('Usage: node addCoupon.js <code> <description> <type> <value> [minOrder] [maxDiscount] [usageLimit] [validDays]');
    console.log('');
    console.log('Parameters:');
    console.log('  code        - Coupon code (e.g., "SUMMER2024")');
    console.log('  description - Description (e.g., "Summer Sale 20% off")');
    console.log('  type        - "percentage" or "fixed"');
    console.log('  value       - Discount value (10 for 10%, 25 for €25)');
    console.log('  minOrder    - Minimum order amount (optional, default: 0)');
    console.log('  maxDiscount - Maximum discount for percentage (optional)');
    console.log('  usageLimit  - Usage limit (optional, default: 1)');
    console.log('  validDays   - Validity in days (optional, default: 30)');
    console.log('');
    console.log('Examples:');
    console.log('  node addCoupon.js "SUMMER20" "Summer Sale" "percentage" 20 100 50 10 60');
    console.log('  node addCoupon.js "FIXED15" "€15 off" "fixed" 15 75 1 30');
    process.exit(1);
}

async function addCoupon() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const [code, description, type, value, minOrder = 0, maxDiscount, usageLimit = 1, validDays = 30] = args;

        // Validate type
        if (!['percentage', 'fixed'].includes(type)) {
            console.error('❌ Type must be "percentage" or "fixed"');
            process.exit(1);
        }

        // Validate value
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            console.error('❌ Value must be a positive number');
            process.exit(1);
        }

        if (type === 'percentage' && numValue > 100) {
            console.error('❌ Percentage value cannot exceed 100');
            process.exit(1);
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            console.error(`❌ Coupon code "${code}" already exists`);
            process.exit(1);
        }

        // Create coupon
        const coupon = new Coupon({
            code: code.toUpperCase(),
            description,
            type,
            value: numValue,
            minOrderAmount: parseFloat(minOrder),
            maxDiscountAmount: maxDiscount ? parseFloat(maxDiscount) : undefined,
            usageLimit: parseInt(usageLimit),
            validFrom: new Date(),
            validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000),
            isActive: true
        });

        await coupon.save();

        console.log('✅ Coupon created successfully!');
        console.log('Coupon Details:');
        console.log(`  Code: ${coupon.code}`);
        console.log(`  Description: ${coupon.description}`);
        console.log(`  Type: ${coupon.type}`);
        console.log(`  Value: ${coupon.value}${coupon.type === 'percentage' ? '%' : '€'}`);
        console.log(`  Min Order Amount: €${coupon.minOrderAmount}`);
        if (coupon.maxDiscountAmount) {
            console.log(`  Max Discount: €${coupon.maxDiscountAmount}`);
        }
        console.log(`  Usage Limit: ${coupon.usageLimit} times`);
        console.log(`  Valid Until: ${coupon.validUntil.toLocaleDateString()}`);

    } catch (error) {
        console.error('❌ Error creating coupon:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addCoupon();

