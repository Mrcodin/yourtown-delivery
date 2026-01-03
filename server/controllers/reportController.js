const Order = require('../models/Order');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

// @desc    Get summary statistics
// @route   GET /api/reports/summary
// @access  Private (Admin/Manager)
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total orders and revenue
    const orders = await Order.find({ ...dateFilter, status: { $ne: 'cancelled' } });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Delivery rate (delivered vs total)
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      summary: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        deliveryRate: deliveryRate.toFixed(1),
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
};

// @desc    Get daily revenue
// @route   GET /api/reports/daily-revenue
// @access  Private (Admin/Manager)
exports.getDailyRevenue = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      dailyRevenue
    });
  } catch (error) {
    console.error('Get daily revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily revenue',
      error: error.message
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/reports/top-products
// @access  Private (Admin/Manager)
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const topProducts = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          emoji: { $first: '$items.emoji' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      topProducts
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message
    });
  }
};

// @desc    Get driver performance
// @route   GET /api/reports/driver-performance
// @access  Private (Admin/Manager)
exports.getDriverPerformance = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: { $ne: 'inactive' } })
      .select('firstName lastName totalDeliveries earnings rating status')
      .sort({ totalDeliveries: -1 });

    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    console.error('Get driver performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching driver performance',
      error: error.message
    });
  }
};

// @desc    Get customer insights
// @route   GET /api/reports/customer-insights
// @access  Private (Admin/Manager)
exports.getCustomerInsights = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const repeatCustomers = await Customer.countDocuments({ totalOrders: { $gt: 1 } });
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Average customer lifetime value
    const customers = await Customer.find();
    const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    // Top customers
    const topCustomers = await Customer.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name phone totalOrders totalSpent');

    res.json({
      success: true,
      insights: {
        totalCustomers,
        repeatCustomers,
        repeatRate: repeatRate.toFixed(1),
        avgLifetimeValue: avgLifetimeValue.toFixed(2),
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get customer insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer insights',
      error: error.message
    });
  }
};

// @desc    Generate PDF Report
// @route   POST /api/reports/pdf
// @access  Private (Admin/Manager)
exports.generatePDFReport = async (req, res) => {
    try {
        const { orders, period } = req.body;

        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ message: 'No orders provided' });
        }

        // Create PDF document
        const doc = new PDFDocument({ 
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Calculate totals
        const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
        const totalTax = orders.reduce((sum, order) => sum + (order.pricing?.tax || 0), 0);
        const totalTips = orders.reduce((sum, order) => sum + (order.pricing?.tip || 0), 0);
        const totalSubtotal = orders.reduce((sum, order) => sum + (order.pricing?.subtotal || 0), 0);
        const totalDeliveryFees = orders.reduce((sum, order) => sum + (order.pricing?.deliveryFee || 0), 0);
        const totalDiscounts = orders.reduce((sum, order) => sum + (order.pricing?.discount || 0), 0);
        const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Payment method breakdown
        const paymentMethods = orders.reduce((acc, order) => {
            const method = order.payment?.method || order.paymentMethod || 'Unknown';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});

        // Status breakdown
        const statusBreakdown = orders.reduce((acc, order) => {
            const status = order.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // HEADER
        doc.fontSize(24)
           .fillColor('#2c3e50')
           .text('SALES REPORT', { align: 'center' });
        
        doc.fontSize(14)
           .fillColor('#7f8c8d')
           .text(period, { align: 'center' });
        
        doc.fontSize(10)
           .text(`Generated: ${new Date().toLocaleString('en-US', { 
               dateStyle: 'full', 
               timeStyle: 'short' 
           })}`, { align: 'center' });

        doc.moveDown(2);

        // SUMMARY BOX
        const summaryY = doc.y;
        doc.roundedRect(50, summaryY, 495, 140, 5)
           .fillAndStroke('#3498db', '#2980b9');

        doc.fillColor('#ffffff')
           .fontSize(16)
           .text('Summary', 60, summaryY + 15);

        doc.fontSize(11);
        
        // Left column
        doc.text(`Total Orders:`, 60, summaryY + 45);
        doc.text(`Total Revenue:`, 60, summaryY + 65);
        doc.text(`Average Order:`, 60, summaryY + 85);
        doc.text(`Total Taxes:`, 60, summaryY + 105);

        // Right column - values
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`${orders.length}`, 200, summaryY + 45, { width: 100, align: 'right' });
        doc.text(`$${totalRevenue.toFixed(2)}`, 200, summaryY + 65, { width: 100, align: 'right' });
        doc.text(`$${averageOrder.toFixed(2)}`, 200, summaryY + 85, { width: 100, align: 'right' });
        doc.fillColor('#2ecc71')
           .text(`$${totalTax.toFixed(2)}`, 200, summaryY + 105, { width: 100, align: 'right' });

        // Second set of columns
        doc.fillColor('#ffffff').font('Helvetica');
        doc.text(`Subtotal:`, 320, summaryY + 45);
        doc.text(`Delivery Fees:`, 320, summaryY + 65);
        doc.text(`Tips Collected:`, 320, summaryY + 85);
        doc.text(`Discounts:`, 320, summaryY + 105);

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`$${totalSubtotal.toFixed(2)}`, 440, summaryY + 45, { width: 100, align: 'right' });
        doc.text(`$${totalDeliveryFees.toFixed(2)}`, 440, summaryY + 65, { width: 100, align: 'right' });
        doc.text(`$${totalTips.toFixed(2)}`, 440, summaryY + 85, { width: 100, align: 'right' });
        doc.fillColor('#e74c3c')
           .text(`-$${totalDiscounts.toFixed(2)}`, 440, summaryY + 105, { width: 100, align: 'right' });

        doc.y = summaryY + 160;
        doc.moveDown(1);

        // PAYMENT METHODS
        doc.fillColor('#2c3e50')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Payment Methods', 50);
        
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        
        Object.entries(paymentMethods).forEach(([method, count]) => {
            const percentage = ((count / orders.length) * 100).toFixed(1);
            doc.fillColor('#34495e')
               .text(`${method}: ${count} orders (${percentage}%)`, 60);
            doc.moveDown(0.3);
        });

        doc.moveDown(1);

        // ORDER STATUS
        doc.fillColor('#2c3e50')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Order Status', 50);
        
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        
        Object.entries(statusBreakdown).forEach(([status, count]) => {
            const percentage = ((count / orders.length) * 100).toFixed(1);
            const statusColors = {
                'Pending': '#f39c12',
                'Confirmed': '#3498db',
                'Preparing': '#9b59b6',
                'Out for Delivery': '#e67e22',
                'Delivered': '#2ecc71',
                'Cancelled': '#e74c3c'
            };
            const color = statusColors[status] || '#34495e';
            
            doc.fillColor(color)
               .text(`${status}: ${count} orders (${percentage}%)`, 60);
            doc.moveDown(0.3);
        });

        doc.moveDown(2);

        // DETAILED ORDER TABLE
        doc.addPage();
        
        doc.fillColor('#2c3e50')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Detailed Order List', 50);
        
        doc.moveDown(1);

        // Table headers
        const tableTop = doc.y;
        const colWidths = {
            orderNum: 60,
            date: 70,
            customer: 110,
            items: 35,
            subtotal: 60,
            tax: 50,
            total: 60
        };

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor('#ffffff');

        // Header background
        doc.rect(50, tableTop - 5, 495, 20)
           .fill('#34495e');

        let x = 55;
        doc.text('Order #', x, tableTop);
        x += colWidths.orderNum;
        doc.text('Date', x, tableTop);
        x += colWidths.date;
        doc.text('Customer', x, tableTop);
        x += colWidths.customer;
        doc.text('Items', x, tableTop);
        x += colWidths.items;
        doc.text('Subtotal', x, tableTop);
        x += colWidths.subtotal;
        doc.text('Tax', x, tableTop);
        x += colWidths.tax;
        doc.text('Total', x, tableTop);

        let currentY = tableTop + 25;
        doc.font('Helvetica').fontSize(8);

        // Sort orders by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0);
            const dateB = new Date(b.createdAt || b.timestamp || 0);
            return dateB - dateA;
        });

        sortedOrders.forEach((order, index) => {
            // Check if we need a new page
            if (currentY > 720) {
                doc.addPage();
                currentY = 50;
            }

            // Alternating row colors
            if (index % 2 === 0) {
                doc.rect(50, currentY - 3, 495, 18)
                   .fill('#ecf0f1');
            }

            doc.fillColor('#2c3e50');

            let x = 55;
            
            // Order number
            const orderNum = order.orderNumber || order._id?.toString().slice(-6) || 'N/A';
            doc.text(orderNum, x, currentY, { width: colWidths.orderNum - 5 });
            x += colWidths.orderNum;

            // Date
            const date = new Date(order.createdAt || order.timestamp || Date.now());
            doc.text(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x, currentY);
            x += colWidths.date;

            // Customer name
            const customerName = order.customer?.name || order.customerName || 'Guest';
            doc.text(customerName, x, currentY, { width: colWidths.customer - 5, ellipsis: true });
            x += colWidths.customer;

            // Item count
            const itemCount = order.items?.length || 0;
            doc.text(itemCount.toString(), x, currentY, { align: 'center' });
            x += colWidths.items;

            // Subtotal
            const subtotal = order.pricing?.subtotal || 0;
            doc.text(`$${subtotal.toFixed(2)}`, x, currentY);
            x += colWidths.subtotal;

            // Tax
            const tax = order.pricing?.tax || 0;
            doc.fillColor('#27ae60')
               .text(`$${tax.toFixed(2)}`, x, currentY);
            x += colWidths.tax;

            // Total
            const total = order.pricing?.total || 0;
            doc.fillColor('#2c3e50')
               .font('Helvetica-Bold')
               .text(`$${total.toFixed(2)}`, x, currentY);
            doc.font('Helvetica');

            currentY += 18;
        });

        // FOOTER
        doc.fontSize(8)
           .fillColor('#95a5a6')
           .text(
               `This report contains ${orders.length} orders. Generated by YourTown Delivery System.`,
               50,
               750,
               { align: 'center', width: 495 }
           );

        // DRIVER PAY STUB PAGE (PAGE 3)
        doc.addPage();
        
        doc.fillColor('#2c3e50')
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('DRIVER PAY STUBS', { align: 'center' });
        
        doc.fontSize(12)
           .fillColor('#7f8c8d')
           .font('Helvetica')
           .text(period, { align: 'center' });
        
        doc.moveDown(2);

        // Calculate driver earnings
        const driverEarnings = {};
        const DRIVER_PAY_RATE = 4.00; // $4 per delivery
        
        // First, collect all unique driver IDs and fetch their names from database
        const driverIds = new Set();
        orders.forEach(order => {
            if (order.delivery?.driverId) {
                const id = typeof order.delivery.driverId === 'object' ? 
                    order.delivery.driverId._id?.toString() : 
                    order.delivery.driverId.toString();
                if (id && id !== 'unassigned') {
                    driverIds.add(id);
                }
            }
        });
        
        // Fetch all driver names at once
        const driverMap = {};
        if (driverIds.size > 0) {
            const drivers = await Driver.find({ _id: { $in: Array.from(driverIds) } })
                .select('firstName lastName')
                .lean();
            
            drivers.forEach(driver => {
                driverMap[driver._id.toString()] = `${driver.firstName} ${driver.lastName}`;
            });
        }
        
        orders.forEach(order => {
            // Get driver info - try multiple sources
            let driverId = null;
            let driverName = null;
            
            // Check delivery.driverId first (populated object or string)
            if (order.delivery?.driverId) {
                if (typeof order.delivery.driverId === 'object' && order.delivery.driverId._id) {
                    driverId = order.delivery.driverId._id.toString();
                    driverName = order.delivery.driverId.firstName ? 
                        `${order.delivery.driverId.firstName} ${order.delivery.driverId.lastName}` :
                        (order.delivery.driverId.name || driverMap[driverId] || order.delivery.driverName);
                } else {
                    driverId = order.delivery.driverId.toString();
                    // Look up driver name from database
                    driverName = driverMap[driverId] || order.delivery.driverName;
                }
            }
            
            // If still no driver info, check driverName field
            if (!driverId && order.delivery?.driverName) {
                driverId = order.delivery.driverName; // Use name as ID if no ID
                driverName = order.delivery.driverName;
            }
            
            // Default to unassigned if no driver found
            if (!driverId) {
                driverId = 'unassigned';
                driverName = 'Unassigned';
            }
            
            // Check if order has delivery fee (meaning it was a delivery order)
            const deliveryFee = order.pricing?.deliveryFee || 0;
            const tip = order.pricing?.tip || 0;
            
            // Only process orders with delivery fees
            if (deliveryFee > 0) {
                if (!driverEarnings[driverId]) {
                    driverEarnings[driverId] = {
                        name: driverName,
                        deliveries: 0,
                        basePay: 0,
                        tips: 0,
                        total: 0,
                        orders: []
                    };
                }
                
                // Count all delivery orders (not just completed ones for payroll purposes)
                // Status check is case-insensitive
                const status = (order.status || '').toLowerCase();
                const isDeliveryComplete = status === 'delivered' || status === 'completed';
                
                if (isDeliveryComplete || status === 'out for delivery' || status === 'confirmed') {
                    const driverPay = DRIVER_PAY_RATE; // $4 per delivery
                    
                    driverEarnings[driverId].deliveries++;
                    driverEarnings[driverId].basePay += driverPay;
                    driverEarnings[driverId].tips += tip;
                    driverEarnings[driverId].total += (driverPay + tip);
                    driverEarnings[driverId].orders.push({
                        orderNum: order.orderNumber || order._id?.toString().slice(-6),
                        date: order.createdAt || order.timestamp,
                        basePay: driverPay,
                        tip,
                        status: order.status
                    });
                }
            }
        });

        // Convert to array and sort by earnings (highest first)
        const driversArray = Object.values(driverEarnings)
            .filter(d => d.deliveries > 0)
            .sort((a, b) => b.total - a.total);

        if (driversArray.length === 0) {
            doc.fontSize(12)
               .fillColor('#7f8c8d')
               .text('No delivery orders found in this period', { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(10)
               .fillColor('#95a5a6')
               .text('Driver pay stubs will appear here when delivery orders are completed.', { align: 'center' });
        } else {
            // Summary statistics
            const totalDriverPay = driversArray.reduce((sum, d) => sum + d.total, 0);
            const totalDeliveries = driversArray.reduce((sum, d) => sum + d.deliveries, 0);
            const avgPayPerDriver = totalDriverPay / driversArray.length;

            // Summary box
            const driverSummaryY = doc.y;
            doc.roundedRect(50, driverSummaryY, 495, 100, 5)
               .fillAndStroke('#27ae60', '#229954');

            doc.fillColor('#ffffff')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Driver Pay Summary', 60, driverSummaryY + 15);

            doc.fontSize(11).font('Helvetica');
            doc.text(`Active Drivers:`, 60, driverSummaryY + 45);
            doc.text(`Total Deliveries:`, 60, driverSummaryY + 65);

            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`${driversArray.length}`, 200, driverSummaryY + 45);
            doc.text(`${totalDeliveries}`, 200, driverSummaryY + 65);

            doc.fillColor('#ffffff').font('Helvetica').fontSize(11);
            doc.text(`Total Driver Pay:`, 320, driverSummaryY + 45);
            doc.text(`Avg per Driver:`, 320, driverSummaryY + 65);

            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`$${totalDriverPay.toFixed(2)}`, 440, driverSummaryY + 45, { width: 100, align: 'right' });
            doc.text(`$${avgPayPerDriver.toFixed(2)}`, 440, driverSummaryY + 65, { width: 100, align: 'right' });

            doc.y = driverSummaryY + 120;
            doc.moveDown(1);

            // Individual driver pay stubs
            driversArray.forEach((driver, index) => {
                // Check if we need a new page
                if (doc.y > 650) {
                    doc.addPage();
                    doc.y = 50;
                }

                const stubY = doc.y;
                
                // Driver card background
                doc.roundedRect(50, stubY, 495, 85, 3)
                   .fillAndStroke('#ecf0f1', '#bdc3c7');

                // Driver name and deliveries
                doc.fillColor('#2c3e50')
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text(driver.name, 60, stubY + 12);

                doc.fontSize(10)
                   .fillColor('#7f8c8d')
                   .font('Helvetica')
                   .text(`${driver.deliveries} ${driver.deliveries === 1 ? 'delivery' : 'deliveries'} completed`, 60, stubY + 32);

                // Earnings breakdown
                doc.fontSize(11)
                   .fillColor('#34495e')
                   .font('Helvetica');

                doc.text(`Base Pay ($4/delivery):`, 60, stubY + 55);
                doc.text(`Tips Received:`, 250, stubY + 55);

                doc.font('Helvetica-Bold');
                doc.text(`$${driver.basePay.toFixed(2)}`, 180, stubY + 55);
                doc.text(`$${driver.tips.toFixed(2)}`, 340, stubY + 55);

                // Total pay (prominent) - using high contrast for better visibility
                // Total pay box with light background
                doc.roundedRect(420, stubY + 10, 115, 65, 3)
                   .fillAndStroke('#f8f9fa', '#2c3e50');

                doc.fontSize(9)
                   .fillColor('#2c3e50')
                   .font('Helvetica-Bold')
                   .text('TOTAL PAY', 425, stubY + 18, { width: 105, align: 'center' });
                
                doc.fontSize(20)
                   .fillColor('#000000')
                   .font('Helvetica-Bold')
                   .text(`$${driver.total.toFixed(2)}`, 425, stubY + 38, { width: 105, align: 'center' });

                doc.y = stubY + 95;
                doc.moveDown(0.5);
            });

            // Footer note
            doc.moveDown(1);
            doc.fontSize(9)
               .fillColor('#7f8c8d')
               .font('Helvetica')
               .text(
                   'Note: Driver base pay is $4.00 per delivery plus tips. Only completed deliveries are included.',
                   50,
                   doc.y,
                   { align: 'center', width: 495 }
               );
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF report' });
        }
    }
};

// @desc    Get frequently bought together products
// @route   GET /api/reports/frequently-bought-together/:productId
// @access  Public
exports.getFrequentlyBoughtTogether = async (req, res) => {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit) || 4;

        // Find all completed orders containing this product
        const ordersWithProduct = await Order.find({
            'items.product': productId,
            status: 'delivered'
        }).populate('items.product');

        if (ordersWithProduct.length === 0) {
            return res.json([]);
        }

        // Count co-occurrences
        const coOccurrences = {};

        ordersWithProduct.forEach(order => {
            order.items.forEach(item => {
                const itemId = item.product._id.toString();
                
                // Skip if it's the same product
                if (itemId === productId) {
                    return;
                }

                if (!coOccurrences[itemId]) {
                    coOccurrences[itemId] = {
                        product: item.product,
                        count: 0
                    };
                }
                coOccurrences[itemId].count++;
            });
        });

        // Calculate confidence and sort
        const totalOrders = ordersWithProduct.length;
        const suggestions = Object.values(coOccurrences)
            .map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    unit: item.product.unit,
                    category: item.product.category,
                    imageUrl: item.product.imageUrl,
                    emoji: item.product.emoji
                },
                count: item.count,
                confidence: (item.count / totalOrders) * 100
            }))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);

        res.json(suggestions);
    } catch (error) {
        console.error('Frequently bought together error:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing purchase patterns'
        });
    }
};
