/* ===================================
   EMAIL CONFIGURATION
   Hometown Delivery
   =================================== */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail', // gmail, sendgrid, mailgun, etc.
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
    try {
        // Check if email is configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
            return null;
        }

        // Create transporter based on service
        // Always read from process.env for latest credentials
        if (process.env.EMAIL_SERVICE === 'gmail') {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
            transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY,
                },
            });
        } else if (process.env.EMAIL_SERVICE === 'mailgun') {
            transporter = nodemailer.createTransport({
                host: 'smtp.mailgun.org',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.MAILGUN_API_KEY,
                },
            });
        } else {
            // Generic SMTP configuration
            transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        }

        console.log('✅ Email service initialized');
        return transporter;
    } catch (error) {
        console.error('❌ Email service initialization failed:', error.message);
        return null;
    }
}

/**
 * Get email transporter (lazy initialization)
 */
function getTransporter() {
    if (!transporter) {
        transporter = initializeTransporter();
    }
    return transporter;
}

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
    const trans = getTransporter();

    if (!trans) {
        return { success: false, message: 'Email not configured' };
    }

    try {
        await trans.verify();
        return { success: true, message: 'Email service is ready' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Send email
 */
async function sendEmail(options) {
    const trans = getTransporter();

    if (!trans) {
        console.warn('Email not sent - service not configured');
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Hometown Delivery" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html?.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
        };

        const info = await trans.sendMail(mailOptions);
        return {
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully',
        };
    } catch (error) {
        console.error('Email send error:', error.message);
        return {
            success: false,
            message: error.message,
        };
    }
}

/**
 * Reinitialize transporter (call after config changes)
 */
function reinitializeTransporter() {
    transporter = null; // Clear cached transporter
    return initializeTransporter();
}

module.exports = {
    initializeTransporter,
    reinitializeTransporter,
    getTransporter,
    verifyEmailConfig,
    sendEmail,
    emailConfig,
};
