const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function addHouseholdItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Non-food household items that ARE taxable in Washington
    const householdItems = [
      {
        name: 'Toilet Paper (12 pack)',
        price: 12.99,
        category: 'household',
        emoji: '🧻',
        description: 'Soft and strong toilet paper, 12 double rolls',
        status: 'active',
        isTaxable: true  // Non-food item - subject to sales tax
      },
      {
        name: 'Paper Towels (6 pack)',
        price: 9.99,
        category: 'household',
        emoji: '🧻',
        description: 'Absorbent paper towels, 6 rolls',
        status: 'active',
        isTaxable: true  // Non-food item - subject to sales tax
      },
      {
        name: 'Dish Soap',
        price: 3.99,
        category: 'household',
        emoji: '🧼',
        description: 'Concentrated dish soap, cuts grease',
        status: 'active',
        isTaxable: true  // Non-food item - subject to sales tax
      },
      {
        name: 'Hand Soap (3 pack)',
        price: 6.99,
        category: 'household',
        emoji: '🧼',
        description: 'Gentle hand soap with moisturizers, 3 bottles',
        status: 'active',
        isTaxable: true  // Non-food item - subject to sales tax
      },
      {
        name: 'All-Purpose Cleaner',
        price: 4.99,
        category: 'household',
        emoji: '🧴',
        description: 'Multi-surface cleaning spray',
        status: 'active',
        isTaxable: true  // Non-food item - subject to sales tax
      }
    ];
    
    console.log('\n📦 Adding 5 household items (these ARE taxable)...\n');
    
    for (const item of householdItems) {
      // Check if item already exists
      const existing = await Product.findOne({ name: item.name });
      if (existing) {
        console.log(`⚠️  ${item.name} already exists, skipping...`);
      } else {
        const product = new Product(item);
        await product.save();
        console.log(`✅ Added: ${item.name} - $${item.price} (Taxable: ${item.isTaxable})`);
      }
    }
    
    const totalProducts = await Product.countDocuments();
    const taxableProducts = await Product.countDocuments({ isTaxable: true });
    
    console.log('\n📊 Summary:');
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Taxable items: ${taxableProducts}`);
    console.log(`   Tax-exempt items: ${totalProducts - taxableProducts}`);
    console.log('\n💡 Tax calculation:');
    console.log('   - Groceries (food): NO SALES TAX (WA RCW 82.08.0293)');
    console.log('   - Household items: 8.4% sales tax (Chelan County)');
    console.log('   - Delivery fee: 8.4% sales tax');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addHouseholdItems();
