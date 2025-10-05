const mongoose = require('mongoose');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

require('dotenv').config({ path: './.env' });

async function checkProducts() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    try {
        // Get all products
        const products = await Product.find({}).populate('supplier', 'name email');

        console.log(`\n📊 Total products in database: ${products.length}`);

        if (products.length === 0) {
            console.log('❌ No products found in database');
            return;
        }

        // Analyze stock levels
        const stockAnalysis = {
            total: products.length,
            withStock: 0,
            outOfStock: 0,
            lowStock: 0,
            criticalStock: 0,
            noStockField: 0
        };

        console.log('\n📦 Product Stock Analysis:');
        console.log('='.repeat(50));

        products.forEach((product, index) => {
            const stock = product.stock;
            const stockStatus = stock === undefined || stock === null ? 'NO FIELD' :
                stock === 0 ? 'OUT OF STOCK' :
                    stock < 5 ? 'CRITICAL' :
                        stock < 10 ? 'LOW' : 'GOOD';

            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Supplier: ${product.supplier?.name || 'Unknown'}`);
            console.log(`   Stock: ${stock !== undefined ? stock : 'undefined/null'}`);
            console.log(`   Status: ${stockStatus}`);
            console.log(`   Price: €${product.price || 'N/A'}`);
            console.log('');

            // Count by category
            if (stock === undefined || stock === null) {
                stockAnalysis.noStockField++;
            } else if (stock === 0) {
                stockAnalysis.outOfStock++;
            } else if (stock < 5) {
                stockAnalysis.criticalStock++;
            } else if (stock < 10) {
                stockAnalysis.lowStock++;
            } else {
                stockAnalysis.withStock++;
            }
        });

        console.log('\n📈 Stock Summary:');
        console.log('='.repeat(30));
        console.log(`Total products: ${stockAnalysis.total}`);
        console.log(`Good stock (≥10): ${stockAnalysis.withStock}`);
        console.log(`Low stock (5-9): ${stockAnalysis.lowStock}`);
        console.log(`Critical stock (<5): ${stockAnalysis.criticalStock}`);
        console.log(`Out of stock (0): ${stockAnalysis.outOfStock}`);
        console.log(`No stock field: ${stockAnalysis.noStockField}`);

        // Show low stock products specifically
        const lowStockProducts = products.filter(p =>
            p.stock !== undefined && p.stock !== null && p.stock < 10
        );

        if (lowStockProducts.length > 0) {
            console.log('\n⚠️  Low Stock Products (< 10 units):');
            console.log('='.repeat(40));
            lowStockProducts.forEach(product => {
                console.log(`- ${product.name}: ${product.stock} units`);
            });
        }

        // Show products without stock field
        const noStockField = products.filter(p =>
            p.stock === undefined || p.stock === null
        );

        if (noStockField.length > 0) {
            console.log('\n❌ Products without stock field:');
            console.log('='.repeat(40));
            noStockField.forEach(product => {
                console.log(`- ${product.name} (ID: ${product._id})`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

checkProducts();
