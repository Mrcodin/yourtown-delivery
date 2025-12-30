/* ===================================
   EMAIL TEMPLATES
   Hometown Delivery
   =================================== */

/**
 * Base email template with consistent styling
 */
function getEmailTemplate(content) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hometown Delivery</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px 20px;
        }
        .order-details {
            background: #f9f9f9;
            border-left: 4px solid #4CAF50;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .order-details h3 {
            margin-top: 0;
            color: #4CAF50;
        }
        .item-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        .item-list li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .item-list li:last-child {
            border-bottom: none;
        }
        .total {
            font-size: 20px;
            font-weight: bold;
            color: #4CAF50;
            text-align: right;
            margin-top: 15px;
        }
        .button {
            display: inline-block;
            padding: 14px 28px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: 600;
        }
        .button:hover {
            background: #45a049;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .status-confirmed {
            background: #d1ecf1;
            color: #0c5460;
        }
        .status-preparing {
            background: #d4edda;
            color: #155724;
        }
        .status-out_for_delivery {
            background: #cce5ff;
            color: #004085;
        }
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        .footer {
            background: #333;
            color: #fff;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        .help-text {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
        <div class="footer">
            <p><strong>Hometown Delivery</strong></p>
            <p>Fresh Groceries Delivered to Your Door</p>
            <p>
                📞 <a href="tel:555-123-4567">555-123-4567</a> | 
                📧 <a href="mailto:support@hometowndelivery.com">support@hometowndelivery.com</a>
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                You received this email because you placed an order with Hometown Delivery.
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Order confirmation email
 */
function orderConfirmationEmail(order, businessInfo = {}) {
    const businessName = businessInfo.businessName || 'Hometown Delivery';
    const businessPhone = businessInfo.phone || '555-123-4567';
    
    const itemsHTML = order.items.map(item => `
        <li>
            <strong>${item.quantity}x</strong> ${item.name || item.productName} 
            <span style="float: right;">$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `).join('');

    const content = `
        <div class="header">
            <div class="icon">🎉</div>
            <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi ${order.customerInfo.name},</p>
            
            <p>Thank you for your order! We've received it and we'll start preparing your groceries soon.</p>
            
            <div class="order-details">
                <h3>Order #${order.orderId}</h3>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Delivery Address:</strong><br>${order.customerInfo.address}</p>
                <p><strong>Preferred Time:</strong> ${order.delivery?.timePreference || 'As soon as possible'}</p>
                
                <h4 style="margin-top: 20px;">Order Items:</h4>
                <ul class="item-list">
                    ${itemsHTML}
                </ul>
                
                <div style="border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal:</span>
                        <span>$${order.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Delivery Fee:</span>
                        <span>$${order.pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                    ${order.pricing.tax ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Tax:</span>
                        <span>$${order.pricing.tax.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="total">
                        Total: $${order.pricing.total.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="help-text">
                <strong>What's Next?</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>We'll call you at <strong>${order.customerInfo.phone}</strong> within 30 minutes to confirm</li>
                    <li>Your order will be prepared and packed fresh</li>
                    <li>You'll receive updates as your order progresses</li>
                    <li>Track your order anytime using the button below</li>
                </ul>
            </div>
            
            <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/track.html?phone=${encodeURIComponent(order.customerInfo.phone)}" class="button">
                    Track Your Order
                </a>
            </center>
            
            <p style="margin-top: 30px;">
                Questions or need to make changes? Call us at <strong>${businessPhone}</strong>
            </p>
            
            <p>Thank you for supporting ${businessName}!</p>
        </div>
    `;

    return {
        subject: `Order Confirmation #${order.orderId} - ${businessName}`,
        html: getEmailTemplate(content)
    };
}

/**
 * Order status update email
 */
function orderStatusUpdateEmail(order, newStatus, businessInfo = {}) {
    const businessName = businessInfo.businessName || 'Hometown Delivery';
    const businessPhone = businessInfo.phone || '555-123-4567';
    
    const statusMessages = {
        'confirmed': {
            icon: '✅',
            title: 'Order Confirmed',
            message: 'Great news! Your order has been confirmed and we\'re starting to prepare it.'
        },
        'preparing': {
            icon: '👨‍🍳',
            title: 'Preparing Your Order',
            message: 'Our team is carefully selecting and packing your groceries right now.'
        },
        'ready_for_pickup': {
            icon: '📦',
            title: 'Ready for Pickup',
            message: 'Your order is packed and ready! Our driver will pick it up shortly.'
        },
        'out_for_delivery': {
            icon: '🚗',
            title: 'Out for Delivery',
            message: 'Your order is on its way! Our driver will arrive soon.'
        },
        'delivered': {
            icon: '🎉',
            title: 'Order Delivered',
            message: 'Your order has been delivered! We hope you enjoy your groceries.'
        },
        'cancelled': {
            icon: '❌',
            title: 'Order Cancelled',
            message: 'Your order has been cancelled. If you didn\'t request this, please contact us.'
        }
    };

    const statusInfo = statusMessages[newStatus] || {
        icon: '📋',
        title: 'Order Update',
        message: 'Your order status has been updated.'
    };

    const content = `
        <div class="header">
            <div class="icon">${statusInfo.icon}</div>
            <h1>${statusInfo.title}</h1>
        </div>
        <div class="content">
            <p>Hi ${order.customerInfo.name},</p>
            
            <p>${statusInfo.message}</p>
            
            <div class="order-details">
                <h3>Order #${order.orderId}</h3>
                <p>
                    <strong>Status:</strong> 
                    <span class="status-badge status-${newStatus}">${newStatus.replace(/_/g, ' ')}</span>
                </p>
                <p><strong>Delivery Address:</strong><br>${order.customerInfo.address}</p>
                ${order.assignedDriver ? `
                <p><strong>Driver:</strong> ${order.assignedDriver.name}</p>
                ${order.assignedDriver.phone ? `<p><strong>Driver Phone:</strong> ${order.assignedDriver.phone}</p>` : ''}
                ` : ''}
            </div>
            
            ${newStatus === 'out_for_delivery' ? `
            <div class="help-text">
                <strong>Estimated Delivery:</strong>
                <p>Your order should arrive within the next 30-45 minutes.</p>
                <p>Please ensure someone is available to receive the delivery.</p>
            </div>
            ` : ''}
            
            ${newStatus === 'delivered' ? `
            <div class="help-text">
                <p>Thank you for your order! We hope everything arrived fresh and in perfect condition.</p>
                <p>We'd love to hear about your experience. Your feedback helps us improve!</p>
            </div>
            ` : ''}
            
            <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/track.html?phone=${encodeURIComponent(order.customerInfo.phone)}" class="button">
                    Track Your Order
                </a>
            </center>
            
            <p style="margin-top: 30px;">
                Questions? Call us at <strong>${businessPhone}</strong>
            </p>
        </div>
    `;

    return {
        subject: `${statusInfo.title} - Order #${order.orderId}`,
        html: getEmailTemplate(content)
    };
}

/**
 * Admin notification email (new order)
 */
function adminNewOrderEmail(order, businessInfo = {}) {
    const businessName = businessInfo.businessName || 'Hometown Delivery';
    
    const itemsHTML = order.items.map(item => `
        <li>
            <strong>${item.quantity}x</strong> ${item.name || item.productName} 
            <span style="float: right;">$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `).join('');

    const content = `
        <div class="header">
            <div class="icon">🔔</div>
            <h1>New Order Received!</h1>
        </div>
        <div class="content">
            <p><strong>A new order has been placed and requires your attention.</strong></p>
            
            <div class="order-details">
                <h3>Order #${order.orderId}</h3>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Total Amount:</strong> <span style="color: #4CAF50; font-size: 20px; font-weight: bold;">$${order.pricing.total.toFixed(2)}</span></p>
                
                <h4 style="margin-top: 20px;">Customer Information:</h4>
                <p>
                    <strong>Name:</strong> ${order.customerInfo.name}<br>
                    <strong>Phone:</strong> <a href="tel:${order.customerInfo.phone}">${order.customerInfo.phone}</a><br>
                    ${order.customerInfo.email ? `<strong>Email:</strong> <a href="mailto:${order.customerInfo.email}">${order.customerInfo.email}</a><br>` : ''}
                    <strong>Address:</strong> ${order.customerInfo.address}
                </p>
                
                <h4 style="margin-top: 20px;">Delivery Details:</h4>
                <p>
                    <strong>Preferred Time:</strong> ${order.delivery?.timePreference || 'ASAP'}<br>
                    <strong>Payment Method:</strong> ${order.payment?.method || 'Cash on Delivery'}
                    ${order.delivery?.instructions ? `<br><strong>Instructions:</strong> ${order.delivery.instructions}` : ''}
                </p>
                
                <h4 style="margin-top: 20px;">Order Items:</h4>
                <ul class="item-list">
                    ${itemsHTML}
                </ul>
                
                <div class="total">
                    Total: $${order.pricing.total.toFixed(2)}
                </div>
            </div>
            
            <div class="help-text" style="background: #fff3cd; border-left-color: #ffc107;">
                <strong>Action Required:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Call customer to confirm order</li>
                    <li>Verify product availability</li>
                    <li>Assign driver for delivery</li>
                    <li>Update order status in admin dashboard</li>
                </ul>
            </div>
            
            <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/admin-orders.html" class="button">
                    View in Admin Dashboard
                </a>
            </center>
        </div>
    `;

    return {
        subject: `🔔 New Order #${order.orderId} - ${businessName}`,
        html: getEmailTemplate(content)
    };
}

/**
 * Test email
 */
function testEmail(recipientName = 'User') {
    const content = `
        <div class="header">
            <div class="icon">✅</div>
            <h1>Email Service Working!</h1>
        </div>
        <div class="content">
            <p>Hi ${recipientName},</p>
            
            <p>This is a test email from your Hometown Delivery email service.</p>
            
            <div class="help-text">
                <p>If you're seeing this email, your email configuration is working correctly!</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>✅ SMTP connection successful</li>
                    <li>✅ Email templates rendering properly</li>
                    <li>✅ Email service ready to use</li>
                </ul>
            </div>
            
            <p>You can now start sending order confirmations and notifications to your customers.</p>
            
            <p><strong>Next steps:</strong></p>
            <ol>
                <li>Test with a real order</li>
                <li>Verify customer receives confirmation email</li>
                <li>Check status update emails are working</li>
            </ol>
        </div>
    `;

    return {
        subject: 'Test Email - Hometown Delivery Email Service',
        html: getEmailTemplate(content)
    };
}

module.exports = {
    getEmailTemplate,
    orderConfirmationEmail,
    orderStatusUpdateEmail,
    adminNewOrderEmail,
    testEmail
};
