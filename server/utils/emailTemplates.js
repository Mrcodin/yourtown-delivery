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

    const itemsHTML = order.items
        .map(
            item => `
        <li>
            <strong>${item.quantity}x</strong> ${item.name || item.productName} 
            <span style="float: right;">$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `
        )
        .join('');

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
                    ${
                        order.pricing.tax
                            ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Tax:</span>
                        <span>$${order.pricing.tax.toFixed(2)}</span>
                    </div>
                    `
                            : ''
                    }
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
        html: getEmailTemplate(content),
    };
}

/**
 * Order status update email
 */
function orderStatusUpdateEmail(order, newStatus, businessInfo = {}) {
    const businessName = businessInfo.businessName || 'Hometown Delivery';
    const businessPhone = businessInfo.phone || '555-123-4567';

    const statusMessages = {
        confirmed: {
            icon: '✅',
            title: 'Order Confirmed',
            message: "Great news! Your order has been confirmed and we're starting to prepare it.",
        },
        preparing: {
            icon: '👨‍🍳',
            title: 'Preparing Your Order',
            message: 'Our team is carefully selecting and packing your groceries right now.',
        },
        ready_for_pickup: {
            icon: '📦',
            title: 'Ready for Pickup',
            message: 'Your order is packed and ready! Our driver will pick it up shortly.',
        },
        out_for_delivery: {
            icon: '🚗',
            title: 'Out for Delivery',
            message: 'Your order is on its way! Our driver will arrive soon.',
        },
        delivered: {
            icon: '🎉',
            title: 'Order Delivered',
            message: 'Your order has been delivered! We hope you enjoy your groceries.',
        },
        cancelled: {
            icon: '❌',
            title: 'Order Cancelled',
            message:
                "Your order has been cancelled. If you didn't request this, please contact us.",
        },
    };

    const statusInfo = statusMessages[newStatus] || {
        icon: '📋',
        title: 'Order Update',
        message: 'Your order status has been updated.',
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
                ${
                    order.assignedDriver
                        ? `
                <p><strong>Driver:</strong> ${order.assignedDriver.name}</p>
                ${order.assignedDriver.phone ? `<p><strong>Driver Phone:</strong> ${order.assignedDriver.phone}</p>` : ''}
                `
                        : ''
                }
            </div>
            
            ${
                newStatus === 'out_for_delivery'
                    ? `
            <div class="help-text">
                <strong>Estimated Delivery:</strong>
                <p>Your order should arrive within the next 30-45 minutes.</p>
                <p>Please ensure someone is available to receive the delivery.</p>
            </div>
            `
                    : ''
            }
            
            ${
                newStatus === 'delivered'
                    ? `
            <div class="help-text">
                <p>Thank you for your order! We hope everything arrived fresh and in perfect condition.</p>
                <p>We'd love to hear about your experience. Your feedback helps us improve!</p>
            </div>
            `
                    : ''
            }
            
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
        html: getEmailTemplate(content),
    };
}

/**
 * Admin notification email (new order)
 */
function adminNewOrderEmail(order, businessInfo = {}) {
    const businessName = businessInfo.businessName || 'Hometown Delivery';

    const itemsHTML = order.items
        .map(
            item => `
        <li>
            <strong>${item.quantity}x</strong> ${item.name || item.productName} 
            <span style="float: right;">$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `
        )
        .join('');

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
        html: getEmailTemplate(content),
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
        html: getEmailTemplate(content),
    };
}

/**
 * Email verification email
 */
function emailVerificationEmail(customerName, verificationUrl) {
    const content = `
        <div class="greeting">
            <h2>Welcome to Hometown Delivery! 🎉</h2>
            <p>Hi ${customerName},</p>
        </div>

        <p>Thank you for creating an account with Hometown Delivery. We're excited to have you join our community!</p>

        <p>To complete your registration and start shopping, please verify your email address by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="btn">
                ✅ Verify Email Address
            </a>
        </div>

        <div class="order-details">
            <p><strong>⏰ This verification link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Hometown Delivery, you can safely ignore this email.</p>
        </div>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>

        <div class="footer-note">
            <p><strong>Why verify your email?</strong></p>
            <ul>
                <li>Receive order confirmations and updates</li>
                <li>Get special offers and promotions</li>
                <li>Reset your password if you forget it</li>
                <li>Ensure account security</li>
            </ul>
        </div>

        <div class="greeting">
            <p>Need help? Contact us:</p>
            <p>📞 <a href="tel:555-123-4567">555-123-4567</a></p>
            <p>📧 <a href="mailto:support@hometowndelivery.com">support@hometowndelivery.com</a></p>
        </div>
    `;

    return {
        subject: 'Verify Your Email - Hometown Delivery',
        html: getEmailTemplate(content),
    };
}

/**
 * Password reset email
 */
function passwordResetEmail(customerName, resetUrl) {
    const content = `
        <div class="greeting">
            <h2>Password Reset Request 🔐</h2>
            <p>Hi ${customerName},</p>
        </div>

        <p>We received a request to reset your password for your Hometown Delivery account.</p>

        <p>Click the button below to create a new password:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="btn">
                🔄 Reset My Password
            </a>
        </div>

        <div class="order-details">
            <p><strong>⏰ This password reset link will expire in 1 hour.</strong></p>
            <p><strong>⚠️ If you didn't request a password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
        </div>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>

        <div class="footer-note">
            <p><strong>Security Tips:</strong></p>
            <ul>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Don't use the same password across multiple sites</li>
                <li>Contact us immediately if you notice suspicious activity</li>
            </ul>
        </div>

        <div class="greeting">
            <p>Questions or concerns?</p>
            <p>📞 <a href="tel:555-123-4567">555-123-4567</a></p>
            <p>📧 <a href="mailto:support@hometowndelivery.com">support@hometowndelivery.com</a></p>
        </div>
    `;

    return {
        subject: 'Reset Your Password - Hometown Delivery',
        html: getEmailTemplate(content),
    };
}

/**
 * Email verification success confirmation
 */
function emailVerifiedEmail(customerName) {
    const content = `
        <div class="greeting">
            <h2>Email Verified Successfully! ✅</h2>
            <p>Hi ${customerName},</p>
        </div>

        <p>Great news! Your email address has been successfully verified.</p>

        <p>You can now enjoy all the benefits of your Hometown Delivery account:</p>

        <div class="order-details">
            <h3>What You Can Do Now:</h3>
            <ul>
                <li>✅ Browse and shop our full product catalog</li>
                <li>📦 Place orders for delivery</li>
                <li>💾 Save multiple delivery addresses</li>
                <li>⭐ Mark your favorite products</li>
                <li>📊 View your order history</li>
                <li>🔄 Quick reorder with "My Usual Order"</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/shop.html" class="btn">
                🛒 Start Shopping Now
            </a>
        </div>

        <div class="greeting">
            <p>Thank you for choosing Hometown Delivery!</p>
            <p>We look forward to serving you.</p>
        </div>

        <div class="greeting">
            <p>Questions? We're here to help:</p>
            <p>📞 <a href="tel:555-123-4567">555-123-4567</a></p>
            <p>📧 <a href="mailto:support@hometowndelivery.com">support@hometowndelivery.com</a></p>
        </div>
    `;

    return {
        subject: 'Welcome to Hometown Delivery! 🎉',
        html: getEmailTemplate(content),
    };
}

/**
 * Order cancellation email template (customer notification)
 */
function orderCancellationEmail(order, reason, businessInfo = {}) {
    const {
        businessName = 'Hometown Delivery',
        businessPhone = '(555) 123-4567',
        businessEmail = 'support@hometowndelivery.com',
    } = businessInfo;

    const content = `
        <div class="content">
            <h2>Order Cancelled</h2>
            <p>Hello ${order.customerInfo.name},</p>
            <p>Your order has been cancelled as requested.</p>
            
            <div class="order-box">
                <h3>Cancelled Order Details</h3>
                <table class="order-details">
                    <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>${order.orderId}</td>
                    </tr>
                    <tr>
                        <td><strong>Cancellation Reason:</strong></td>
                        <td>${reason}</td>
                    </tr>
                    <tr>
                        <td><strong>Order Date:</strong></td>
                        <td>${new Date(order.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}</td>
                    </tr>
                    <tr>
                        <td><strong>Cancelled At:</strong></td>
                        <td>${new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}</td>
                    </tr>
                </table>
            </div>

            ${
                order.payment?.method === 'card'
                    ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <strong>💳 Refund Information</strong>
                <p style="margin: 10px 0 0 0;">Your payment of $${order.pricing.total.toFixed(2)} will be refunded to your original payment method within 5-7 business days.</p>
            </div>
            `
                    : ''
            }

            <div class="items-section">
                <h3>Cancelled Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                            .map(
                                item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>

            <div class="total-box">
                <table class="total-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td>$${order.pricing.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Delivery Fee:</td>
                        <td>$${order.pricing.deliveryFee.toFixed(2)}</td>
                    </tr>
                    ${
                        order.pricing.tip > 0
                            ? `
                    <tr>
                        <td>Tip:</td>
                        <td>$${order.pricing.tip.toFixed(2)}</td>
                    </tr>
                    `
                            : ''
                    }
                    <tr>
                        <td>Tax:</td>
                        <td>$${order.pricing.tax.toFixed(2)}</td>
                    </tr>
                    ${
                        order.pricing.discount > 0
                            ? `
                    <tr style="color: #28a745;">
                        <td>Discount:</td>
                        <td>-$${order.pricing.discount.toFixed(2)}</td>
                    </tr>
                    `
                            : ''
                    }
                    <tr class="total-row">
                        <td><strong>Total Amount:</strong></td>
                        <td><strong>$${order.pricing.total.toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>

            <p>We're sorry to see this order cancelled. If you have any questions or would like to place a new order, please don't hesitate to contact us.</p>
            
            <div class="button-container">
                <a href="${businessInfo.websiteUrl || 'http://localhost:8080'}/shop.html" class="button">Browse Products</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${businessName}</strong></p>
            <p>📞 ${businessPhone} | 📧 ${businessEmail}</p>
            <p style="font-size: 12px; color: #999;">
                This is an automated email. Please do not reply directly to this message.
            </p>
        </div>
    `;

    return {
        subject: `Order #${order.orderId} Cancelled - ${businessName}`,
        html: getEmailTemplate(content),
    };
}

/**
 * Order cancellation email template (admin notification)
 */
function adminOrderCancellationEmail(order, reason, businessInfo = {}) {
    const { businessName = 'Hometown Delivery', businessPhone = '(555) 123-4567' } = businessInfo;

    const content = `
        <div class="content">
            <h2>⚠️ Order Cancelled by Customer</h2>
            <p>A customer has cancelled their order.</p>
            
            <div class="order-box">
                <h3>Order Details</h3>
                <table class="order-details">
                    <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>${order.orderId}</td>
                    </tr>
                    <tr>
                        <td><strong>Customer:</strong></td>
                        <td>${order.customerInfo.name}</td>
                    </tr>
                    <tr>
                        <td><strong>Phone:</strong></td>
                        <td>${order.customerInfo.phone}</td>
                    </tr>
                    <tr>
                        <td><strong>Cancellation Reason:</strong></td>
                        <td><strong style="color: #dc3545;">${reason}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Order Total:</strong></td>
                        <td>$${order.pricing.total.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Payment Method:</strong></td>
                        <td>${order.payment?.method === 'card' ? '💳 Card' : order.payment?.method === 'cash' ? '💵 Cash' : '📝 Check'}</td>
                    </tr>
                </table>
            </div>

            ${
                order.payment?.method === 'card'
                    ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <strong>💳 Refund Required</strong>
                <p style="margin: 10px 0 0 0;">This was a card payment. Process refund of $${order.pricing.total.toFixed(2)} through Stripe dashboard.</p>
            </div>
            `
                    : ''
            }

            <div class="items-section">
                <h3>Cancelled Items (${order.items.length})</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                            .map(
                                item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>

            <div class="button-container">
                <a href="${businessInfo.adminUrl || 'http://localhost:8080'}/admin-orders.html" class="button">View in Admin Dashboard</a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                <strong>Next Steps:</strong><br>
                1. Review cancellation reason<br>
                ${order.payment?.method === 'card' ? '2. Process refund through Stripe<br>3. ' : '2. '}Update inventory if needed<br>
                ${order.payment?.method === 'card' ? '4. ' : '3. '}Follow up with customer if appropriate
            </p>
        </div>
        
        <div class="footer">
            <p><strong>${businessName} - Admin Notification</strong></p>
            <p>📞 ${businessPhone}</p>
            <p style="font-size: 12px; color: #999;">
                This is an automated admin notification.
            </p>
        </div>
    `;

    return {
        subject: `🚨 Order Cancelled: #${order.orderId} - ${businessName}`,
        html: getEmailTemplate(content),
    };
}

module.exports = {
    getEmailTemplate,
    orderConfirmationEmail,
    orderStatusUpdateEmail,
    adminNewOrderEmail,
    testEmail,
    emailVerificationEmail,
    passwordResetEmail,
    emailVerifiedEmail,
    orderCancellationEmail,
    adminOrderCancellationEmail,
};
