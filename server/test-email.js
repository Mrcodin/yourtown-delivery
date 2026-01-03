#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests email configuration and sends a test email
 */

require('dotenv').config();
const { sendEmail, verifyEmailConfig } = require('./config/email');
const { testEmail } = require('./utils/emailTemplates');

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');

    // Check environment variables
    console.log('Environment Variables:');
    console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.log(
        '  EMAIL_PASSWORD:',
        process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET'
    );
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
    console.log('');

    // Verify email configuration
    console.log('Verifying SMTP connection...');
    const isConfigValid = await verifyEmailConfig();

    if (!isConfigValid) {
        console.error('\n❌ Email configuration is invalid or not set up.');
        console.log('\nTo set up email:');
        console.log('1. Copy .env.example to .env');
        console.log('2. Add your email credentials');
        console.log('3. For Gmail: Enable 2FA and create an App Password');
        console.log('4. Run this test again\n');
        process.exit(1);
    }

    console.log('✅ SMTP connection verified!\n');

    // Send test email
    const testEmailTo = process.env.EMAIL_USER;

    if (!testEmailTo) {
        console.error('❌ No recipient email set. Set EMAIL_USER in .env');
        process.exit(1);
    }

    console.log(`Sending test email to: ${testEmailTo}...`);

    try {
        const emailContent = testEmail('Test User');

        await sendEmail({
            to: testEmailTo,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        console.log('✅ Test email sent successfully!');
        console.log(`\nCheck your inbox at ${testEmailTo}\n`);
        console.log('Email Service Status:');
        console.log('  ✅ Configuration valid');
        console.log('  ✅ SMTP connection working');
        console.log('  ✅ Email sent successfully');
        console.log('\n🎉 Email service is ready to use!\n');
    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
        console.log('\nTroubleshooting:');
        console.log('- Check your email credentials');
        console.log(
            "- For Gmail: Make sure you're using an App Password, not your account password"
        );
        console.log('- Check if your email provider requires "Less secure app access"');
        console.log('- Verify your firewall/network allows SMTP connections\n');
        process.exit(1);
    }
}

// Run the test
testEmailService();
