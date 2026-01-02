// ==========================================
// DATABASE INDEXES SCRIPT
// Adds performance indexes to MongoDB
// ==========================================

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

async function addIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Product indexes
        console.log('📦 Creating Product indexes...');
        try {
            await Product.collection.createIndex({ category: 1 });
            await Product.collection.createIndex({ price: 1 });
            await Product.collection.createIndex({ isActive: 1 });
            console.log('✅ Product indexes created');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️  Product indexes already exist');
            } else {
                throw error;
            }
        }

        // Order indexes
        console.log('📋 Creating Order indexes...');
        try {
            await Order.collection.createIndex({ status: 1 });
            await Order.collection.createIndex({ createdAt: -1 });
            await Order.collection.createIndex({ 'customerInfo.phone': 1 });
            await Order.collection.createIndex({ customerId: 1 });
            await Order.collection.createIndex({ 'delivery.driverId': 1 });
            console.log('✅ Order indexes created');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️  Order indexes already exist');
            } else {
                throw error;
            }
        }

        // Customer indexes
        console.log('👤 Creating Customer indexes...');
        try {
            await Customer.collection.createIndex({ createdAt: -1 });
            await Customer.collection.createIndex({ isVerified: 1 });
            console.log('✅ Customer indexes created');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️  Customer indexes already exist');
            } else {
                throw error;
            }
        }

        // Driver indexes
        console.log('🚗 Creating Driver indexes...');
        try {
            await Driver.collection.createIndex({ isActive: 1 });
            await Driver.collection.createIndex({ status: 1 });
            console.log('✅ Driver indexes created');
        } catch (error) {
            if (error.code === 85) {
                console.log('ℹ️  Driver indexes already exist');
            } else {
                throw error;
            }
        }

        // Show all indexes
        console.log('\n📊 Index Summary:');
        const productIndexes = await Product.collection.indexes();
        const orderIndexes = await Order.collection.indexes();
        const customerIndexes = await Customer.collection.indexes();
        const driverIndexes = await Driver.collection.indexes();

        console.log(`\nProducts: ${productIndexes.length} indexes`);
        productIndexes.forEach(idx => console.log(`  - ${Object.keys(idx.key).join(', ')}`));

        console.log(`\nOrders: ${orderIndexes.length} indexes`);
        orderIndexes.forEach(idx => console.log(`  - ${Object.keys(idx.key).join(', ')}`));

        console.log(`\nCustomers: ${customerIndexes.length} indexes`);
        customerIndexes.forEach(idx => console.log(`  - ${Object.keys(idx.key).join(', ')}`));

        console.log(`\nDrivers: ${driverIndexes.length} indexes`);
        driverIndexes.forEach(idx => console.log(`  - ${Object.keys(idx.key).join(', ')}`));

        console.log('\n🎉 All indexes created successfully!');
        console.log('\n💡 Performance improvements:');
        console.log('   - Faster product searches and filtering');
        console.log('   - Faster order lookups by phone/status');
        console.log('   - Faster customer authentication');
        console.log('   - Faster driver queries');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

addIndexes();
