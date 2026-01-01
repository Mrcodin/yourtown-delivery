const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF receipt for an order
 * @param {Object} order - Order object from database
 * @param {String} outputPath - Optional file path to save PDF
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReceipt(order, outputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Receipt - Order ${order.orderId}`,
          Author: 'Hometown Delivery'
        }
      });

      const buffers = [];
      
      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.on('error', reject);

      // Header - Business Name
      doc.fontSize(24)
         .fillColor('#2563eb')
         .text('Hometown Delivery', { align: 'center' })
         .moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#666666')
         .text('Your Local Grocery & Essentials Delivery', { align: 'center' })
         .text('123 Main Street, Hometown, ST 12345', { align: 'center' })
         .text('Phone: 555-123-4567', { align: 'center' })
         .moveDown(1.5);

      // Receipt Title
      doc.fontSize(18)
         .fillColor('#000000')
         .text('ORDER RECEIPT', { align: 'center' })
         .moveDown(1);

      // Horizontal line
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke()
         .moveDown(1);

      // Order Information
      const leftColumn = 50;
      const rightColumn = 300;
      const startY = doc.y;

      doc.fontSize(10)
         .fillColor('#666666')
         .text('Order Number:', leftColumn, doc.y)
         .fillColor('#000000')
         .text(order.orderId, leftColumn + 100, startY);

      doc.fillColor('#666666')
         .text('Order Date:', leftColumn, doc.y + 20)
         .fillColor('#000000')
         .text(new Date(order.createdAt).toLocaleString('en-US', {
           dateStyle: 'medium',
           timeStyle: 'short'
         }), leftColumn + 100, startY + 20);

      doc.fillColor('#666666')
         .text('Payment Method:', leftColumn, doc.y + 20)
         .fillColor('#000000')
         .text(order.payment.method.toUpperCase(), leftColumn + 100, startY + 40);

      doc.fillColor('#666666')
         .text('Payment Status:', leftColumn, doc.y + 20)
         .fillColor(order.payment.status === 'completed' ? '#10b981' : '#f59e0b')
         .text(order.payment.status.toUpperCase(), leftColumn + 100, startY + 60);

      // Customer Information
      doc.fillColor('#666666')
         .text('Customer Name:', rightColumn, startY)
         .fillColor('#000000')
         .text(order.customerInfo.name, rightColumn + 100, startY);

      doc.fillColor('#666666')
         .text('Phone:', rightColumn, startY + 20)
         .fillColor('#000000')
         .text(order.customerInfo.phone, rightColumn + 100, startY + 20);

      if (order.customerInfo.email) {
        doc.fillColor('#666666')
           .text('Email:', rightColumn, startY + 40)
           .fillColor('#000000')
           .text(order.customerInfo.email, rightColumn + 100, startY + 40);
      }

      doc.y = startY + 100;
      doc.moveDown(1);

      // Delivery Address
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Delivery Address:', leftColumn, doc.y);

      doc.fontSize(10)
         .fillColor('#333333')
         .text(order.customerInfo.address, leftColumn, doc.y + 20)
         .moveDown(2);

      // Items Table Header
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Item', leftColumn, tableTop)
         .text('Qty', 350, tableTop, { width: 50, align: 'center' })
         .text('Price', 420, tableTop, { width: 60, align: 'right' })
         .text('Total', 490, tableTop, { width: 60, align: 'right' })
         .font('Helvetica');

      doc.moveDown(0.5);
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(0.5);

      // Items List
      doc.fontSize(10)
         .fillColor('#333333');

      let itemY = doc.y;
      order.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        if (itemY > 700) { // Check if we need a new page
          doc.addPage();
          itemY = 50;
        }

        // Don't include emoji in PDF - PDFKit doesn't handle Unicode emojis well
        // Just show the product name
        doc.text(item.name, leftColumn, itemY)
           .text(item.quantity.toString(), 350, itemY, { width: 50, align: 'center' })
           .text(`$${item.price.toFixed(2)}`, 420, itemY, { width: 60, align: 'right' })
           .text(`$${itemTotal.toFixed(2)}`, 490, itemY, { width: 60, align: 'right' });

        itemY += 25;
      });

      doc.y = itemY;
      doc.moveDown(1);

      // Totals Section
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(0.5);

      const totalsX = 400;
      const subtotal = order.pricing?.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const delivery = order.pricing?.deliveryFee || 6.99;
      const tip = order.pricing?.tip || 0;
      const tax = order.pricing?.tax || 0;
      const discount = order.pricing?.discount || 0;
      const total = order.pricing?.total || (subtotal + delivery + tip + tax - discount);

      let currentY = doc.y;

      // Subtotal
      doc.fontSize(10)
         .fillColor('#666666')
         .text('Subtotal:', totalsX, currentY)
         .fillColor('#000000')
         .text(`$${subtotal.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
      
      currentY += 20;

      // Delivery Fee
      doc.fillColor('#666666')
         .text('Delivery Fee:', totalsX, currentY)
         .fillColor('#000000')
         .text(`$${delivery.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
      
      currentY += 20;

      // Tip (if present)
      if (tip > 0) {
        doc.fillColor('#666666')
           .text('Driver Tip:', totalsX, currentY)
           .fillColor('#16a34a')
           .text(`$${tip.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
        currentY += 20;
      }

      // Tax (if present)
      if (tax > 0) {
        doc.fillColor('#666666')
           .text('Tax (on delivery):', totalsX, currentY)
           .fillColor('#000000')
           .text(`$${tax.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
        currentY += 20;
      }

      // Discount (if present)
      if (discount > 0) {
        doc.fillColor('#666666')
           .text('Discount:', totalsX, currentY)
           .fillColor('#10b981')
           .text(`-$${discount.toFixed(2)}`, 490, currentY, { width: 60, align: 'right' });
        currentY += 20;
      }

      // Update doc.y to current position
      doc.y = currentY;
      doc.moveDown(0.5);

      // Horizontal line
      doc.strokeColor('#000000')
         .lineWidth(2)
         .moveTo(totalsX, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      doc.moveDown(0.5);

      // Total
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('TOTAL:', totalsX, doc.y)
         .text(`$${total.toFixed(2)}`, 490, doc.y, { width: 60, align: 'right' })
         .font('Helvetica');

      doc.moveDown(2);

      // Footer
      doc.fontSize(9)
         .fillColor('#999999')
         .text('Thank you for your order!', leftColumn, doc.y, { align: 'center', width: 495 })
         .moveDown(0.3)
         .text('For questions or support, contact us at support@hometowndelivery.com', leftColumn, doc.y, { align: 'center', width: 495 })
         .moveDown(0.3)
         .text('Visit us at www.hometowndelivery.com', leftColumn, doc.y, { align: 'center', width: 495 });

      // Page numbers (if multiple pages)
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#999999')
           .text(`Page ${i + 1} of ${pages.count}`, 50, 770, { align: 'center', width: 495 });
      }

      // Save to file if path provided
      if (outputPath) {
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceipt };
