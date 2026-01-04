# Email Notifications Setup Guide

This guide explains how to set up email notifications for the Hometown Delivery application.

## Overview

The application sends automated emails for:
- **Order Confirmations** - Sent to customers when they place an order
- **Status Updates** - Sent when order status changes (preparing, out for delivery, delivered)
- **Admin Notifications** - Sent to admins when a new order is received
- **Delivery Notifications** - Sent when order is delivered with driver details

## Email Service Options

Choose ONE of the following email services:

### 1. Gmail (Easiest for Development)

**Pros:**
- Free and easy to set up
- Perfect for testing and development
- No account registration required

**Cons:**
- Daily sending limits (100-500 emails/day)
- Not recommended for production

**Setup:**
1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an "App Password" for "Mail"
4. Add to `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=Hometown Delivery <noreply@hometowndelivery.com>
ADMIN_EMAIL=admin@hometowndelivery.com
```

### 2. SendGrid (Recommended for Production)

**Pros:**
- Free tier: 100 emails/day
- Reliable delivery
- Great analytics
- Email validation

**Cons:**
- Requires account registration
- Domain verification recommended

**Setup:**
1. Sign up at: https://sendgrid.com
2. Create an API key (Settings → API Keys)
3. Add to `.env`:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Hometown Delivery <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Mailgun (Alternative Production Option)

**Pros:**
- Free tier: 5,000 emails/month for 3 months
- Reliable delivery
- Good for transactional emails

**Cons:**
- Requires credit card
- Domain verification required

**Setup:**
1. Sign up at: https://mailgun.com
2. Get API key and domain
3. Add to `.env`:
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=Hometown Delivery <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Custom SMTP (Any Email Provider)

Use any SMTP server (Office 365, custom mail server, etc.)

**Setup:**
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Hometown Delivery <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
```

## Quick Start

### Step 1: Install Dependencies

Already installed! nodemailer is in package.json.

### Step 2: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your email credentials (see options above)

3. Set your admin email:
```env
ADMIN_EMAIL=your-admin-email@example.com
```

### Step 3: Test Email Configuration

Run the test script to verify everything is working:

```bash
cd server
node test-email.js
```

You should see:
```
✅ SMTP connection verified!
✅ Test email sent successfully!
🎉 Email service is ready to use!
```

Check your inbox for the test email.

### Step 4: Restart Server

Restart your server to load the new configuration:

```bash
npm start
```

## Testing Email Notifications

### Test Order Confirmation Email

Place a test order through the website:

1. Go to http://localhost:5500/shop.html
2. Add items to cart
3. Go to checkout
4. **Important:** Use a real email address
5. Complete the order

You should receive:
- ✅ Order confirmation email to customer
- ✅ New order notification to admin

### Test Status Update Emails

Update order status in admin panel:

1. Go to http://localhost:5500/admin-orders.html
2. Click on an order
3. Change status (e.g., "Preparing" → "Out for Delivery")
4. Customer receives status update email

## Email Templates

All email templates are responsive and mobile-friendly with:
- Professional design
- Clear order details
- Track order button
- Contact information
- Delivery instructions

Templates are in: `server/utils/emailTemplates.js`

### Customizing Templates

Edit `server/utils/emailTemplates.js` to customize:
- Colors and styling
- Company name and logo
- Contact information
- Email content and messaging

## Troubleshooting

### "Authentication failed" with Gmail

**Problem:** Gmail rejects login

**Solutions:**
1. Make sure 2FA is enabled
2. Use App Password, not your regular password
3. App Password should be 16 characters (no spaces)
4. Try generating a new App Password

### "Connection timeout"

**Problem:** Can't connect to SMTP server

**Solutions:**
1. Check your internet connection
2. Verify firewall isn't blocking SMTP (port 587/465)
3. Try different EMAIL_PORT (587 or 465)
4. Set EMAIL_SECURE=true for port 465

### Emails not being sent

**Problem:** No errors but emails don't arrive

**Solutions:**
1. Check spam/junk folder
2. Verify EMAIL_FROM is a valid email address
3. Run `node test-email.js` to verify configuration
4. Check email service limits (Gmail: 100/day)
5. Review server console for error messages

### SendGrid "Sender Identity" error

**Problem:** SendGrid requires verified sender

**Solutions:**
1. Verify your email address in SendGrid
2. Or verify your domain
3. Use verified email in EMAIL_FROM

## Production Deployment

### Recommended Setup

For production, use SendGrid or Mailgun:

**Why?**
- Higher sending limits
- Better deliverability
- Email tracking and analytics
- Professional sender reputation

**Setup:**
1. Register for SendGrid/Mailgun
2. Verify your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Use environment variables on hosting platform
5. Test thoroughly before going live

### Environment Variables on Render.com

When deploying to Render:

1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add these variables:
   ```
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-api-key
   EMAIL_FROM=Hometown Delivery <noreply@yourdomain.com>
   ADMIN_EMAIL=admin@yourdomain.com
   FRONTEND_URL=https://your-frontend-url.com
   ```

## Email Configuration Reference

### All Environment Variables

```env
# Required for all services
EMAIL_FROM=Hometown Delivery <noreply@example.com>
ADMIN_EMAIL=admin@example.com
FRONTEND_URL=https://your-site.com

# Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=app-password

# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxx

# Mailgun
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.example.com

# Custom SMTP
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=user@example.com
EMAIL_PASSWORD=password
```

## Email Templates Customization

### Changing Business Information

Edit `server/utils/emailTemplates.js`:

```javascript
// Update footer contact info
📞 <a href="tel:YOUR-PHONE">YOUR-PHONE</a> | 
📧 <a href="mailto:YOUR-EMAIL">YOUR-EMAIL</a>

// Update business name
const businessName = 'Your Business Name';
```

### Adding Logo

1. Host your logo online or use data URI
2. Edit email template header:
```javascript
<div class="header">
    <img src="https://your-logo-url.com/logo.png" alt="Logo" style="max-width: 150px;">
    <h1>Order Confirmed!</h1>
</div>
```

### Changing Colors

Edit CSS in `getEmailTemplate()` function:

```javascript
.header {
    background: linear-gradient(135deg, #YOUR-COLOR 0%, #YOUR-COLOR-2 100%);
}
.button {
    background: #YOUR-COLOR;
}
```

## Support

If you encounter issues:

1. Check server console logs
2. Run `node test-email.js`
3. Verify .env configuration
4. Test with different email addresses
5. Check email service status pages

## Summary

✅ **Easy Setup** - Choose Gmail for quick development testing
✅ **Production Ready** - Use SendGrid/Mailgun for deployment  
✅ **Professional Templates** - Responsive, mobile-friendly emails
✅ **Automated Sending** - Works automatically with orders
✅ **Customizable** - Easy to modify templates and styling

---

**Next Steps:**
1. Choose an email service (Gmail for dev, SendGrid for prod)
2. Configure `.env` with credentials
3. Run `node test-email.js`
4. Place a test order to verify

**Need Help?** Check the troubleshooting section or review server logs for specific error messages.
