const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_TOKEN = 'your-admin-token-here'; // You'll need to get this from login

async function addCouponViaAPI() {
    try {
        const couponData = {
            code: 'HOLIDAY25',
            description: 'Holiday Special - 25% off all orders',
            type: 'percentage',
            value: 25,
            minOrderAmount: 75,
            maxDiscountAmount: 50,
            usageLimit: 200,
            validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
        };

        const response = await axios.post(`${API_BASE_URL}/api/coupons/create`, couponData, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log('✅ Coupon created via API!');
            console.log('Coupon Details:', response.data.coupon);
        } else {
            console.error('❌ Failed to create coupon:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Error creating coupon via API:', error.response?.data?.message || error.message);
    }
}

// Uncomment the line below to run this script
// addCouponViaAPI();

