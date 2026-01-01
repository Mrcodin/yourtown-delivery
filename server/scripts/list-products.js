const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const products = await Product.find({}).sort({ name: 1 });
    
    console.log('\n📦 ALL PRODUCTS:');
    console.log('==========================================');
    products.forEach((p, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${p.name.padEnd(30)} | ${p.category.padEnd(10)} | $${p.price.toFixed(2)} | Taxable: ${p.isTaxable || false}`);
    });
    
    console.log(`\n💰 Total products: ${products.length}`);
    console.log('\n🔍 Looking for non-food items that should be taxable...');
    console.log('Common non-food items: toilet paper, paper towels, soap, dish soap, cleaning supplies');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listProducts();
