const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function testTaxCalculation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get some products
        const milk = await Product.findOne({ name: /Milk/i });
        const bread = await Product.findOne({ name: /Bread/i });
        const toiletPaper = await Product.findOne({ name: /Toilet Paper/i });
        const dishSoap = await Product.findOne({ name: /Dish Soap/i });

        console.log('🧪 TEST ORDER SCENARIOS\n');
        console.log('='.repeat(70));

        // Scenario 1: Only groceries
        console.log('\n📦 SCENARIO 1: Only Groceries (Tax-Exempt)');
        console.log('-'.repeat(70));
        const scenario1Items = [
            { name: milk.name, price: milk.price, qty: 2, taxable: milk.isTaxable },
            { name: bread.name, price: bread.price, qty: 1, taxable: bread.isTaxable },
        ];

        let subtotal1 = 0;
        scenario1Items.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal1 += itemTotal;
            console.log(
                `   ${item.name.padEnd(30)} $${item.price.toFixed(2)} × ${item.qty} = $${itemTotal.toFixed(2)} ${item.taxable ? '(TAXABLE)' : '(TAX-EXEMPT)'}`
            );
        });

        const deliveryFee = 6.99;
        const taxRate = 0.084;
        const taxableItems1 = scenario1Items
            .filter(i => i.taxable)
            .reduce((sum, i) => sum + i.price * i.qty, 0);
        const taxableAmount1 = deliveryFee + taxableItems1;
        const tax1 = taxableAmount1 * taxRate;
        const total1 = subtotal1 + deliveryFee + tax1;

        console.log(`\n   Subtotal:           $${subtotal1.toFixed(2)}`);
        console.log(`   Delivery Fee:       $${deliveryFee.toFixed(2)}`);
        console.log(
            `   Taxable Amount:     $${taxableAmount1.toFixed(2)} (delivery: $${deliveryFee.toFixed(2)} + taxable items: $${taxableItems1.toFixed(2)})`
        );
        console.log(`   Tax (8.4%):         $${tax1.toFixed(2)}`);
        console.log(`   ────────────────────────────`);
        console.log(`   TOTAL:              $${total1.toFixed(2)}`);

        // Scenario 2: Mixed cart (groceries + household items)
        console.log('\n\n📦 SCENARIO 2: Mixed Cart (Groceries + Household Items)');
        console.log('-'.repeat(70));
        const scenario2Items = [
            { name: milk.name, price: milk.price, qty: 1, taxable: milk.isTaxable },
            { name: bread.name, price: bread.price, qty: 1, taxable: bread.isTaxable },
            {
                name: toiletPaper.name,
                price: toiletPaper.price,
                qty: 1,
                taxable: toiletPaper.isTaxable,
            },
            { name: dishSoap.name, price: dishSoap.price, qty: 2, taxable: dishSoap.isTaxable },
        ];

        let subtotal2 = 0;
        scenario2Items.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal2 += itemTotal;
            console.log(
                `   ${item.name.padEnd(30)} $${item.price.toFixed(2)} × ${item.qty} = $${itemTotal.toFixed(2)} ${item.taxable ? '(TAXABLE ✓)' : '(TAX-EXEMPT)'}`
            );
        });

        const taxableItems2 = scenario2Items
            .filter(i => i.taxable)
            .reduce((sum, i) => sum + i.price * i.qty, 0);
        const taxableAmount2 = deliveryFee + taxableItems2;
        const tax2 = taxableAmount2 * taxRate;
        const total2 = subtotal2 + deliveryFee + tax2;

        console.log(`\n   Subtotal:           $${subtotal2.toFixed(2)}`);
        console.log(`   Delivery Fee:       $${deliveryFee.toFixed(2)}`);
        console.log(
            `   Taxable Amount:     $${taxableAmount2.toFixed(2)} (delivery: $${deliveryFee.toFixed(2)} + taxable items: $${taxableItems2.toFixed(2)})`
        );
        console.log(`   Tax (8.4%):         $${tax2.toFixed(2)}`);
        console.log(`   ────────────────────────────`);
        console.log(`   TOTAL:              $${total2.toFixed(2)}`);

        // Scenario 3: Only household items
        console.log('\n\n📦 SCENARIO 3: Only Household Items (All Taxable)');
        console.log('-'.repeat(70));
        const scenario3Items = [
            {
                name: toiletPaper.name,
                price: toiletPaper.price,
                qty: 2,
                taxable: toiletPaper.isTaxable,
            },
            { name: dishSoap.name, price: dishSoap.price, qty: 1, taxable: dishSoap.isTaxable },
        ];

        let subtotal3 = 0;
        scenario3Items.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal3 += itemTotal;
            console.log(
                `   ${item.name.padEnd(30)} $${item.price.toFixed(2)} × ${item.qty} = $${itemTotal.toFixed(2)} ${item.taxable ? '(TAXABLE ✓)' : '(TAX-EXEMPT)'}`
            );
        });

        const taxableItems3 = scenario3Items
            .filter(i => i.taxable)
            .reduce((sum, i) => sum + i.price * i.qty, 0);
        const taxableAmount3 = deliveryFee + taxableItems3;
        const tax3 = taxableAmount3 * taxRate;
        const total3 = subtotal3 + deliveryFee + tax3;

        console.log(`\n   Subtotal:           $${subtotal3.toFixed(2)}`);
        console.log(`   Delivery Fee:       $${deliveryFee.toFixed(2)}`);
        console.log(
            `   Taxable Amount:     $${taxableAmount3.toFixed(2)} (delivery: $${deliveryFee.toFixed(2)} + taxable items: $${taxableItems3.toFixed(2)})`
        );
        console.log(`   Tax (8.4%):         $${tax3.toFixed(2)}`);
        console.log(`   ────────────────────────────`);
        console.log(`   TOTAL:              $${total3.toFixed(2)}`);

        console.log('\n\n💡 KEY POINTS:');
        console.log('   ✅ Groceries (food items) are TAX-EXEMPT in Washington State');
        console.log('   ✅ Household items (soap, paper products) ARE taxable at 8.4%');
        console.log('   ✅ Delivery fee is ALWAYS taxable at 8.4%');
        console.log('   ✅ Tax savings compared to states that tax food: ~$3-4 per order!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testTaxCalculation();
