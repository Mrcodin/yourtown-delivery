const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateReceipt } = require('../utils/pdfReceipt');

async function testTipPDF() {
    try {
        console.log('🔌 Connecting to MongoDB...\n');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        // Create a mock order with tip
        const mockOrder = {
            orderId: 'TEST-TIP-001',
            createdAt: new Date(),
            customerInfo: {
                name: 'John Doe',
                phone: '555-1234',
                email: 'john@example.com',
                address: '123 Test St, Test City, TS 12345',
            },
            items: [
                { name: 'Apples', quantity: 2, price: 3.99 },
                { name: 'Bread', quantity: 1, price: 4.5 },
            ],
            pricing: {
                subtotal: 12.48,
                deliveryFee: 6.99,
                tip: 5.0, // ← THE TIP
                tax: 0.59,
                discount: 0,
                total: 25.06, // Should be: 12.48 + 6.99 + 5.00 + 0.59 = 25.06 ✅
            },
            payment: {
                method: 'card',
                status: 'completed',
            },
            status: 'delivered',
        };

        console.log('📊 Mock Order Details:');
        console.log('  Subtotal: $' + mockOrder.pricing.subtotal.toFixed(2));
        console.log('  Delivery: $' + mockOrder.pricing.deliveryFee.toFixed(2));
        console.log('  Tip:      $' + mockOrder.pricing.tip.toFixed(2));
        console.log('  Tax:      $' + mockOrder.pricing.tax.toFixed(2));
        console.log('  Discount: $' + mockOrder.pricing.discount.toFixed(2));
        console.log('  ─────────────────────');
        console.log('  TOTAL:    $' + mockOrder.pricing.total.toFixed(2));
        console.log('\n🔧 Generating PDF...\n');

        // Generate PDF
        const pdfBuffer = await generateReceipt(mockOrder);

        // Save PDF
        const outputPath = path.join(__dirname, 'test-receipt-with-tip.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log('✅ PDF generated successfully!');
        console.log('📁 Saved to:', outputPath);
        console.log('📊 File size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
        console.log('\n👁️  Please open the PDF and verify:');
        console.log('   1. Tip line shows: $5.00');
        console.log('   2. Total line shows: $25.06');
        console.log('\nIf total shows $20.06 instead of $25.06, the bug is confirmed!');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testTipPDF();
