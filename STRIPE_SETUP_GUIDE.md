# Stripe Payment Integration Setup Guide

## 🚀 Quick Start

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Verify your email

### Step 2: Get API Keys
1. Log in to Stripe Dashboard
2. Click **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)
5. **⚠️ IMPORTANT:** Never commit secret keys to GitHub!

### Step 3: Configure Environment Variables

Edit `server/.env` and add your Stripe keys:

```env
# Stripe API Keys (TEST MODE - Safe for development)
STRIPE_SECRET_KEY=sk_test_51abcdefghijklmnopqrstuvwxyz...
STRIPE_PUBLISHABLE_KEY=pk_test_51abcdefghijklmnopqrstuvwxyz...
STRIPE_WEBHOOK_SECRET=whsec_... (get this later)
```

### Step 4: Add Publishable Key to Frontend

Edit `config.js` and add:

```javascript
// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51abcdefghijklmnopqrstuvwxyz...';
```

---

## 📋 Features Implemented

### ✅ Payment Flow
1. **Cart Page** - Stripe Elements integration
2. **Payment Processing** - Secure card handling
3. **Order Confirmation** - Success/failure handling
4. **Email Receipts** - Automatic email on payment success
5. **Admin Dashboard** - View payments and issue refunds

### ✅ Security Features
- PCI compliant (Stripe handles all card data)
- Payment Intent API (3D Secure support)
- Webhook verification for server-side confirmation
- No card data touches your server

### ✅ Error Handling
- Card declined
- Insufficient funds
- Network errors
- Invalid card numbers
- Expired cards

---

## 🧪 Testing

### Test Card Numbers (Stripe provides these)

**Successful Payments:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Card Declined:**
```
Card Number: 4000 0000 0000 0002
```

**Insufficient Funds:**
```
Card Number: 4000 0000 0000 9995
```

**3D Secure Authentication:**
```
Card Number: 4000 0025 0000 3155
(Will trigger authentication flow)
```

**More test cards:** https://stripe.com/docs/testing#cards

---

## 🔧 Webhook Setup (Production)

Webhooks ensure payment confirmation even if user closes browser.

### Local Development (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/payments/webhook
   ```
4. Copy the webhook secret (starts with `whsec_`)
5. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Production (Render/Vercel/etc)

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret**
6. Add to production environment variables

---

## 💰 Pricing

### Stripe Fees
- **2.9% + 30¢** per successful card charge
- No setup fees
- No monthly fees
- No hidden costs

### Example:
- Order total: $50.00
- Stripe fee: $1.75 (2.9% of $50 + $0.30)
- You receive: $48.25

---

## 📊 Monitoring Payments

### Stripe Dashboard
- View all transactions: https://dashboard.stripe.com/payments
- Track refunds
- Monitor disputes
- Download reports

### Admin Panel
- Go to `/admin-reports.html`
- View payment history
- Issue refunds
- Track revenue

---

## 🚨 Troubleshooting

### "Stripe is not defined"
- Check `config.js` has `STRIPE_PUBLISHABLE_KEY`
- Verify Stripe.js script is loaded in HTML `<head>`

### "Invalid API Key"
- Verify keys in `.env` match Stripe Dashboard
- Check you're using TEST keys (pk_test_ / sk_test_)
- Restart server after changing `.env`

### "Payment Intent creation failed"
- Check server is running
- Verify MongoDB is connected
- Check server console for errors
- Ensure STRIPE_SECRET_KEY is set

### Webhooks not working
- Check webhook URL is correct
- Verify STRIPE_WEBHOOK_SECRET is set
- Check server logs for webhook errors
- Test with Stripe CLI first

---

## 🔐 Security Checklist

- [x] Never expose secret key (sk_) in frontend code
- [x] Use HTTPS in production
- [x] Verify webhook signatures
- [x] Store sensitive data in environment variables
- [x] Use Payment Intents API (not deprecated Charges API)
- [x] Implement proper error handling
- [x] Log payment activities
- [x] Validate amounts server-side

---

## 🎓 Additional Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Testing Guide:** https://stripe.com/docs/testing
- **Webhook Events:** https://stripe.com/docs/api/events/types
- **Security Best Practices:** https://stripe.com/docs/security
- **PCI Compliance:** https://stripe.com/docs/security/guide

---

## 📞 Support

- **Stripe Support:** https://support.stripe.com
- **Status Page:** https://status.stripe.com
- **Community Forum:** https://community.stripe.com

---

## ✅ Go Live Checklist

Before accepting real payments:

1. [ ] Switch to live API keys (pk_live_ / sk_live_)
2. [ ] Activate Stripe account (provide business info)
3. [ ] Set up production webhooks
4. [ ] Enable HTTPS on your domain
5. [ ] Test complete payment flow
6. [ ] Set up email notifications
7. [ ] Configure tax calculation (if needed)
8. [ ] Review refund policy
9. [ ] Add terms of service
10. [ ] Test with real card (small amount)

---

## 📝 Notes

- Keep test and live keys separate
- Monitor the first few live transactions closely
- Set up fraud protection in Stripe Radar
- Consider adding Apple Pay / Google Pay later
- Review Stripe fees for your region

---

**Last Updated:** December 31, 2025  
**Version:** 1.0
