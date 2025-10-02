const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Supplier = require('../models/Supplier');
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');

const API_BASE_URL = 'http://localhost:5000';

// Simple HTTP client using Node.js built-in modules
const https = require('https');
const http = require('http');
const { URL } = require('url');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testAllAPIs() {
    console.log('🔍 Starting comprehensive API testing...\n');

    try {
        // Connect to MongoDB to get test credentials
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get test users
        const supplier = await Supplier.findOne({ email: 'essayedneder0711@gmail.com' });
        const client = await Client.findOne({});

        let supplierToken = null;
        let clientToken = null;

        if (supplier) {
            supplierToken = jwt.sign(
                { id: supplier._id, role: 'supplier' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
        }

        if (client) {
            clientToken = jwt.sign(
                { id: client._id, role: 'client' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
        }

        const results = [];

        // Test cases
        const testCases = [
            // Health Check
            {
                name: 'Health Check',
                method: 'GET',
                url: '/api/health',
                auth: false
            },

            // Auth Routes
            {
                name: 'Auth - Register (should fail without data)',
                method: 'POST',
                url: '/api/auth/register',
                auth: false,
                expectedStatus: [400, 422]
            },

            // Products Routes
            {
                name: 'Products - Get Categories',
                method: 'GET',
                url: '/api/products/categories',
                auth: false
            },
            {
                name: 'Products - Get Supplier Products',
                method: 'GET',
                url: '/api/products/supplier',
                auth: 'supplier',
                token: supplierToken
            },
            {
                name: 'Products - Create Product (should fail without data)',
                method: 'POST',
                url: '/api/products',
                auth: 'supplier',
                token: supplierToken,
                expectedStatus: [400, 422]
            },

            // Orders Routes
            {
                name: 'Orders - Get All Orders',
                method: 'GET',
                url: '/api/orders',
                auth: 'supplier',
                token: supplierToken
            },
            {
                name: 'Orders - Get My Orders (Client)',
                method: 'GET',
                url: '/api/orders/my-orders',
                auth: 'client',
                token: clientToken
            },

            // Supplier Routes
            {
                name: 'Supplier - Get Stats',
                method: 'GET',
                url: '/api/supplier/stats',
                auth: 'supplier',
                token: supplierToken
            },
            {
                name: 'Supplier - Get Orders',
                method: 'GET',
                url: '/api/supplier/orders',
                auth: 'supplier',
                token: supplierToken
            },

            // Client Inventory Routes
            {
                name: 'Client Inventory - Get Inventory',
                method: 'GET',
                url: '/api/client-inventory',
                auth: 'client',
                token: clientToken
            },

            // Recommendations Routes
            {
                name: 'Recommendations - Get Recommendations',
                method: 'GET',
                url: '/api/recommendations',
                auth: 'client',
                token: clientToken
            },

            // Chatbot Routes
            {
                name: 'Chatbot - Send Message (should fail without data)',
                method: 'POST',
                url: '/api/chatbot/message',
                auth: false,
                expectedStatus: [400, 422]
            },

            // Statistics Routes
            {
                name: 'Statistics - Get Stats',
                method: 'GET',
                url: '/api/statistics',
                auth: 'supplier',
                token: supplierToken
            },

            // Payment Routes
            {
                name: 'Payments - Get Payment Methods',
                method: 'GET',
                url: '/api/payments/methods',
                auth: 'client',
                token: clientToken
            },

            // Coupons Routes
            {
                name: 'Coupons - Get Coupons',
                method: 'GET',
                url: '/api/coupons',
                auth: 'client',
                token: clientToken
            }
        ];

        console.log('🧪 Running API tests...\n');

        for (const test of testCases) {
            try {
                const options = {
                    method: test.method
                };

                if (test.auth && test.token) {
                    options.headers = {
                        'Authorization': `Bearer ${test.token}`
                    };
                }

                if (test.body) {
                    options.body = test.body;
                }

                const response = await makeRequest(`${API_BASE_URL}${test.url}`, options);

                const expectedStatuses = test.expectedStatus || [200, 201];
                const isSuccess = expectedStatuses.includes(response.status);

                const result = {
                    name: test.name,
                    method: test.method,
                    url: test.url,
                    status: response.status,
                    success: isSuccess,
                    auth: test.auth || 'none',
                    response: typeof response.data === 'object' ?
                        JSON.stringify(response.data).substring(0, 100) + '...' :
                        response.data.substring(0, 100) + '...'
                };

                results.push(result);

                const statusIcon = isSuccess ? '✅' : '❌';
                console.log(`${statusIcon} ${test.name}`);
                console.log(`   ${test.method} ${test.url} → ${response.status}`);
                if (!isSuccess) {
                    console.log(`   Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`);
                }
                console.log('');

            } catch (error) {
                const result = {
                    name: test.name,
                    method: test.method,
                    url: test.url,
                    status: 'ERROR',
                    success: false,
                    auth: test.auth || 'none',
                    response: error.message
                };

                results.push(result);
                console.log(`❌ ${test.name}`);
                console.log(`   ${test.method} ${test.url} → ERROR: ${error.message}`);
                console.log('');
            }
        }

        // Generate summary
        const totalTests = results.length;
        const successfulTests = results.filter(r => r.success).length;
        const failedTests = totalTests - successfulTests;

        console.log('📊 API TEST SUMMARY');
        console.log('==================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Successful: ${successfulTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
        console.log('');

        // Show failed tests
        if (failedTests > 0) {
            console.log('❌ FAILED TESTS:');
            console.log('================');
            results.filter(r => !r.success).forEach(result => {
                console.log(`- ${result.name} (${result.method} ${result.url}) → ${result.status}`);
            });
            console.log('');
        }

        // Show successful tests by category
        console.log('✅ SUCCESSFUL TESTS BY CATEGORY:');
        console.log('================================');
        const categories = {};
        results.filter(r => r.success).forEach(result => {
            const category = result.name.split(' - ')[0];
            if (!categories[category]) categories[category] = [];
            categories[category].push(result.name);
        });

        Object.keys(categories).forEach(category => {
            console.log(`${category}: ${categories[category].length} tests`);
        });

    } catch (error) {
        console.error('❌ Error during API testing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testAllAPIs();

