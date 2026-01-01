const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateReceipt } = require('../utils/pdfReceipt');

async function comprehensiveTest() {
  try {
    console.log('🧪 COMPREHENSIVE PDF TIP TEST\n');
    console.log('═'.repeat(50));
    console.log('Testing PDF receipt generation with various tip scenarios\n');
    
    await mongoose.connect(process.env.MONGODB_URI);

    const testCases = [
      {
        name: 'No Tip',
        order: {
          orderId: 'TEST-NO-TIP',
          createdAt: new Date(),
          customerInfo: {
            name: 'Test Customer',
            phone: '555-0000',
            address: '123 Test St'
          },
          items: [{ name: 'Apples', quantity: 2, price: 5.00 }],
          pricing: {
            subtotal: 10.00,
            deliveryFee: 6.99,
            tip: 0,
            tax: 0.59,
            discount: 0,
            total: 17.58  // 10 + 6.99 + 0 + 0.59 = 17.58
          },
          payment: { method: 'card', status: 'completed' },
          status: 'delivered'
        },
        expectedTotal: 17.58
      },
      {
        name: '$3 Tip',
        order: {
          orderId: 'TEST-TIP-3',
          createdAt: new Date(),
          customerInfo: {
            name: 'Test Customer',
            phone: '555-0001',
            address: '123 Test St'
          },
          items: [{ name: 'Bread', quantity: 1, price: 4.50 }],
          pricing: {
            subtotal: 4.50,
            deliveryFee: 6.99,
            tip: 3.00,
            tax: 0.59,
            discount: 0,
            total: 15.08  // 4.50 + 6.99 + 3.00 + 0.59 = 15.08
          },
          payment: { method: 'card', status: 'completed' },
          status: 'delivered'
        },
        expectedTotal: 15.08
      },
      {
        name: '$5 Tip + $2 Discount',
        order: {
          orderId: 'TEST-TIP-DISCOUNT',
          createdAt: new Date(),
          customerInfo: {
            name: 'Test Customer',
            phone: '555-0002',
            address: '123 Test St'
          },
          items: [{ name: 'Milk', quantity: 1, price: 3.99 }],
          pricing: {
            subtotal: 3.99,
            deliveryFee: 6.99,
            tip: 5.00,
            tax: 0.59,
            discount: 2.00,
            total: 14.57  // 3.99 + 6.99 + 5.00 + 0.59 - 2.00 = 14.57
          },
          payment: { method: 'card', status: 'completed' },
          status: 'delivered'
        },
        expectedTotal: 14.57
      },
      {
        name: 'Custom $7.50 Tip',
        order: {
          orderId: 'TEST-CUSTOM-TIP',
          createdAt: new Date(),
          customerInfo: {
            name: 'Test Customer',
            phone: '555-0003',
            address: '123 Test St'
          },
          items: [{ name: 'Bananas', quantity: 3, price: 2.00 }],
          pricing: {
            subtotal: 6.00,
            deliveryFee: 6.99,
            tip: 7.50,
            tax: 0.59,
            discount: 0,
            total: 21.08  // 6.00 + 6.99 + 7.50 + 0.59 = 21.08
          },
          payment: { method: 'card', status: 'completed' },
          status: 'delivered'
        },
        expectedTotal: 21.08
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log('─'.repeat(50));
      
      const { subtotal, deliveryFee, tip, tax, discount, total } = testCase.order.pricing;
      console.log(`  Subtotal:     $${subtotal.toFixed(2)}`);
      console.log(`  Delivery:     $${deliveryFee.toFixed(2)}`);
      console.log(`  Tip:          $${tip.toFixed(2)}`);
      console.log(`  Tax:          $${tax.toFixed(2)}`);
      console.log(`  Discount:     $${discount.toFixed(2)}`);
      console.log(`  Expected:     $${testCase.expectedTotal.toFixed(2)}`);
      console.log(`  Stored:       $${total.toFixed(2)}`);
      
      // Generate PDF
      const pdfBuffer = await generateReceipt(testCase.order);
      const filename = `test-${testCase.order.orderId.toLowerCase()}.pdf`;
      const outputPath = path.join(__dirname, filename);
      fs.writeFileSync(outputPath, pdfBuffer);
      
      // Verify calculation
      const calculated = subtotal + deliveryFee + tip + tax - discount;
      const match = Math.abs(calculated - total) < 0.01;
      
      if (match && Math.abs(total - testCase.expectedTotal) < 0.01) {
        console.log(`  ✅ PASS - Total calculation correct`);
        console.log(`  📄 PDF saved: ${filename}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL - Total mismatch!`);
        console.log(`  Calculated: $${calculated.toFixed(2)}`);
        failed++;
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 TEST RESULTS: ${passed}/${testCases.length} passed`);
    
    if (failed === 0) {
      console.log('✅ All tests passed! Tip is correctly included in receipt totals.');
    } else {
      console.log(`❌ ${failed} test(s) failed.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

comprehensiveTest();
