const crypto = require('crypto');
const { sendEmail, verifyEmailConfig, reinitializeTransporter } = require('../config/email');
const {
    testEmail,
    orderConfirmationEmail,
    orderStatusUpdateEmail,
    adminNewOrderEmail,
} = require('../utils/emailTemplates');

// In-memory storage for email config (in production, use database)
let emailConfig = {
    provider: process.env.EMAIL_SERVICE || null,
    user: process.env.EMAIL_USER || null,
    password: process.env.EMAIL_PASSWORD ? '***' : null,
    apiKey: process.env.SENDGRID_API_KEY || process.env.MAILGUN_API_KEY ? '***' : null,
    host: process.env.EMAIL_HOST || null,
    port: process.env.EMAIL_PORT || null,
    secure: process.env.EMAIL_SECURE === 'true',
    domain: process.env.MAILGUN_DOMAIN || null,
    from: process.env.EMAIL_FROM || null,
    fromName: 'Hometown Delivery',
    adminEmail: process.env.ADMIN_EMAIL || null,
    configured: false,
};

// Email history (in production, store in database)
const emailHistory = [];

// Encryption key (in production, use proper key management)
// Must be exactly 32 bytes for AES-256
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'hometown-delivery-secret-key!';
const algorithm = 'aes-256-cbc';

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || text === '***') return null;
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// @desc    Get email configuration
// @route   GET /api/email/config
// @access  Private (Admin)
exports.getEmailConfig = async (req, res) => {
    try {
        // Check if email is configured
        const configured = !!(
            emailConfig.provider &&
            (emailConfig.password || emailConfig.apiKey) &&
            emailConfig.from
        );

        // Test connection if configured
        let connected = false;
        if (configured) {
            try {
                connected = await verifyEmailConfig();
            } catch (error) {
                console.error('Email verification error:', error);
            }
        }

        // Return config without sensitive data
        const safeConfig = {
            provider: emailConfig.provider,
            user: emailConfig.user,
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            domain: emailConfig.domain,
            from: emailConfig.from,
            fromName: emailConfig.fromName,
            adminEmail: emailConfig.adminEmail,
            // Don't send passwords/keys
        };

        res.json({
            success: true,
            config: safeConfig,
            status: {
                configured,
                connected,
                provider: emailConfig.provider,
                from: emailConfig.from,
                adminEmail: emailConfig.adminEmail,
            },
        });
    } catch (error) {
        console.error('Get email config error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email configuration',
        });
    }
};

// @desc    Save email configuration
// @route   POST /api/email/config
// @access  Private (Admin)
exports.saveEmailConfig = async (req, res) => {
    try {
        const {
            provider,
            user,
            password,
            apiKey,
            host,
            port,
            secure,
            domain,
            from,
            fromName,
            adminEmail,
        } = req.body;

        // Validate required fields
        if (!provider || !from) {
            return res.status(400).json({
                success: false,
                message: 'Provider and from email are required',
            });
        }

        // Update configuration
        emailConfig.provider = provider;
        emailConfig.from = from;
        emailConfig.fromName = fromName || 'Hometown Delivery';
        emailConfig.adminEmail = adminEmail;

        // Provider-specific configuration
        if (provider === 'gmail') {
            if (!user || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Gmail requires email and app password',
                });
            }
            emailConfig.user = user;
            emailConfig.password = encrypt(password);
            // Set environment variables
            process.env.EMAIL_SERVICE = 'gmail';
            process.env.EMAIL_USER = user;
            process.env.EMAIL_PASSWORD = password;
        } else if (provider === 'sendgrid') {
            if (!apiKey) {
                return res.status(400).json({
                    success: false,
                    message: 'SendGrid requires API key',
                });
            }
            emailConfig.apiKey = encrypt(apiKey);
            process.env.EMAIL_SERVICE = 'sendgrid';
            process.env.SENDGRID_API_KEY = apiKey;
        } else if (provider === 'mailgun') {
            if (!apiKey || !domain) {
                return res.status(400).json({
                    success: false,
                    message: 'Mailgun requires API key and domain',
                });
            }
            emailConfig.apiKey = encrypt(apiKey);
            emailConfig.domain = domain;
            process.env.EMAIL_SERVICE = 'mailgun';
            process.env.MAILGUN_API_KEY = apiKey;
            process.env.MAILGUN_DOMAIN = domain;
        } else if (provider === 'smtp') {
            if (!host || !port || !user || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'SMTP requires host, port, username, and password',
                });
            }
            emailConfig.host = host;
            emailConfig.port = port;
            emailConfig.secure = secure || false;
            emailConfig.user = user;
            emailConfig.password = encrypt(password);
            process.env.EMAIL_SERVICE = 'smtp';
            process.env.EMAIL_HOST = host;
            process.env.EMAIL_PORT = port;
            process.env.EMAIL_SECURE = secure ? 'true' : 'false';
            process.env.EMAIL_USER = user;
            process.env.EMAIL_PASSWORD = password;
        }

        // Set common environment variables
        process.env.EMAIL_FROM = from;
        process.env.ADMIN_EMAIL = adminEmail;

        emailConfig.configured = true;

        // Reinitialize email transporter with new config
        reinitializeTransporter();
        console.log('✅ Email transporter reinitialized with new configuration');

        // TODO: In production, save to database instead of environment variables

        res.json({
            success: true,
            message: 'Email configuration saved successfully',
        });
    } catch (error) {
        console.error('Save email config error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving email configuration',
        });
    }
};

// @desc    Test email connection
// @route   POST /api/email/test-connection
// @access  Private (Admin)
exports.testConnection = async (req, res) => {
    try {
        const isValid = await verifyEmailConfig();

        if (isValid) {
            res.json({
                success: true,
                message: 'Email connection successful!',
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Email connection failed. Please check your configuration.',
            });
        }
    } catch (error) {
        console.error('Test connection error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to test email connection',
        });
    }
};

// @desc    Send test email
// @route   POST /api/email/send-test
// @access  Private (Admin)
exports.sendTestEmail = async (req, res) => {
    try {
        const { to, type = 'test' } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                message: 'Recipient email is required',
            });
        }

        let emailContent;

        // Generate appropriate test email based on type
        if (type === 'test') {
            emailContent = testEmail('Admin');
        } else if (type === 'order-confirmation') {
            // Mock order data
            const mockOrder = {
                orderId: 'TEST-' + Date.now(),
                customerInfo: {
                    name: 'John Doe',
                    phone: '555-1234',
                    email: to,
                    address: '123 Main St, Anytown, ST 12345',
                },
                items: [
                    { name: 'Fresh Milk', quantity: 2, price: 3.99 },
                    { name: 'Whole Wheat Bread', quantity: 1, price: 2.49 },
                ],
                pricing: {
                    subtotal: 10.47,
                    deliveryFee: 6.99,
                    total: 17.46,
                },
                delivery: {
                    timePreference: 'ASAP',
                },
                createdAt: new Date(),
            };
            emailContent = orderConfirmationEmail(mockOrder);
        } else if (type === 'status-update') {
            const mockOrder = {
                orderId: 'TEST-' + Date.now(),
                customerInfo: {
                    name: 'John Doe',
                    phone: '555-1234',
                    email: to,
                    address: '123 Main St, Anytown, ST 12345',
                },
                assignedDriver: {
                    name: 'Mike Driver',
                    phone: '555-9876',
                },
            };
            emailContent = orderStatusUpdateEmail(mockOrder, 'out_for_delivery');
        } else if (type === 'admin-notification') {
            const mockOrder = {
                orderId: 'TEST-' + Date.now(),
                customerInfo: {
                    name: 'John Doe',
                    phone: '555-1234',
                    email: 'customer@example.com',
                    address: '123 Main St, Anytown, ST 12345',
                },
                items: [
                    { name: 'Fresh Milk', quantity: 2, price: 3.99 },
                    { name: 'Whole Wheat Bread', quantity: 1, price: 2.49 },
                ],
                pricing: {
                    subtotal: 10.47,
                    deliveryFee: 6.99,
                    total: 17.46,
                },
                delivery: {
                    timePreference: 'ASAP',
                },
                payment: {
                    method: 'cash',
                },
                createdAt: new Date(),
            };
            emailContent = adminNewOrderEmail(mockOrder);
        }

        // Send the email
        await sendEmail({
            to,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        // Log to history
        emailHistory.unshift({
            sentAt: new Date(),
            to,
            type,
            subject: emailContent.subject,
            status: 'sent',
        });

        // Keep only last 100 emails
        if (emailHistory.length > 100) {
            emailHistory.pop();
        }

        res.json({
            success: true,
            message: `Test email sent to ${to}`,
        });
    } catch (error) {
        console.error('Send test email error:', error);

        // Log failed attempt
        emailHistory.unshift({
            sentAt: new Date(),
            to: req.body.to,
            type: req.body.type || 'test',
            subject: 'Failed to send',
            status: 'failed',
            error: error.message,
        });

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send test email',
        });
    }
};

// @desc    Get email history
// @route   GET /api/email/history
// @access  Private (Admin)
exports.getEmailHistory = async (req, res) => {
    try {
        const { filter = 'all' } = req.query;

        let filteredHistory = emailHistory;

        if (filter === 'sent') {
            filteredHistory = emailHistory.filter(e => e.status === 'sent');
        } else if (filter === 'failed') {
            filteredHistory = emailHistory.filter(e => e.status === 'failed');
        }

        res.json({
            success: true,
            history: filteredHistory.slice(0, 50), // Return last 50
        });
    } catch (error) {
        console.error('Get email history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email history',
        });
    }
};

// Log email sending (called from other controllers)
exports.logEmail = emailData => {
    emailHistory.unshift({
        sentAt: new Date(),
        ...emailData,
    });

    // Keep only last 100
    if (emailHistory.length > 100) {
        emailHistory.pop();
    }
};
