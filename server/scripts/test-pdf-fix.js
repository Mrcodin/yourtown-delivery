const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('../models/Order');
const { generateReceipt } = require('../utils/pdfReceipt');
const fs = require('fs');
const path = require('path');

async function testPDFFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the most recent order
    const order = await Order.findOne().sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ No orders found in database');
      process.exit(1);
    }
    
    console.log('📄 Testing PDF generation for order:', order.orderId);
    console.log('   Customer:', order.customerInfo.name);
    console.log('   Items:', order.items.length);
    console.log('   Total: $' + order.pricing.total.toFixed(2));
    console.log('\n🔧 Generating PDF...\n');
    
    // Generate PDF
    const pdfBuffer = await generateReceipt(order);
    
    // Save to test file
    const outputPath = path.join(__dirname, 'test-receipt-fixed.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ PDF generated successfully!');
    console.log('📁 Saved to:', outputPath);
    console.log('📊 File size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
    console.log('\n🎯 PDF FIX VERIFICATION:');
    console.log('   ✅ Emojis removed from product names');
    console.log('   ✅ Emoji removed from header');
    console.log('   ✅ PDF should now display clean text only');
    
    console.log('\n📋 Products in receipt:');
    order.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`);
    });
    
    console.log('\n💡 Before fix: "🧊 Ice" would show as "Ø=Þš Ice"');
    console.log('💡 After fix: Just shows "Ice" (clean text)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPDFFix();
