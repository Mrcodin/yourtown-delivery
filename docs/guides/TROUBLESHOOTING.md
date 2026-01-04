# 🔧 Troubleshooting Guide - Hometown Delivery

Complete guide to diagnosing and fixing common issues with the Hometown Delivery platform.

---

## 📋 Table of Contents

1. [Server Issues](#server-issues)
2. [Database Problems](#database-problems)
3. [Authentication Errors](#authentication-errors)
4. [Payment Issues](#payment-issues)
5. [Email Problems](#email-problems)
6. [Frontend Issues](#frontend-issues)
7. [Performance Problems](#performance-problems)
8. [Deployment Issues](#deployment-issues)
9. [Development Environment](#development-environment)
10. [Quick Fixes](#quick-fixes)

---

## 🖥️ Server Issues

### Server Won't Start

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Cause:** Port 3000 is already in use by another process.

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

---

### Module Not Found Errors

**Symptom:** `Error: Cannot find module 'express'`

**Cause:** Dependencies not installed.

**Solution:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### CORS Errors

**Symptom:** `Access to fetch at 'http://localhost:3000/api/products' has been blocked by CORS policy`

**Cause:** Frontend URL not in allowed origins.

**Solution:**
```bash
# Update server/.env
CORS_ORIGIN=http://localhost:5500
FRONTEND_URL=http://localhost:5500

# Restart server
npm start
```

---

### Server Crashes on Startup

**Symptom:** Server starts then immediately crashes.

**Cause:** Usually database connection failure.

**Solution:**
```bash
# Check MongoDB connection
# View full error in console

# Common fixes:
# 1. Check MongoDB URI in .env
# 2. Ensure IP whitelist in MongoDB Atlas
# 3. Verify network connectivity

# Test MongoDB connection
node -e "require('./config/database')();"
```

---

## 🗄️ Database Problems

### Connection Timeout

**Symptom:** `MongooseServerSelectionError: connect ETIMEDOUT`

**Cause:** Cannot reach MongoDB server.

**Solution:**
```bash
# 1. Check internet connection
ping 8.8.8.8

# 2. Verify MongoDB URI in server/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yourtown?retryWrites=true&w=majority

# 3. Whitelist IP in MongoDB Atlas
# Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

# 4. Test connection
mongo "mongodb+srv://cluster.mongodb.net" --username <user>
```

---

### Authentication Failed

**Symptom:** `MongoServerError: bad auth : Authentication failed`

**Cause:** Wrong database credentials.

**Solution:**
```bash
# 1. Verify username/password in MongoDB Atlas
# 2. Update server/.env with correct credentials
# 3. Ensure password doesn't contain special characters (URL encode if needed)
# 4. Create new database user if needed
```

---

### Collection Not Found

**Symptom:** `Collection 'products' not found`

**Cause:** Database not seeded.

**Solution:**
```bash
cd server
npm run seed
```

---

### Index Creation Errors

**Symptom:** `Error: Index with name already exists with different options`

**Cause:** Database schema changed but old indexes remain.

**Solution:**
```bash
# Drop all indexes and recreate
node -e "
const mongoose = require('mongoose');
require('./config/database')();
setTimeout(async () => {
  await mongoose.connection.db.collection('products').dropIndexes();
  await mongoose.connection.db.collection('orders').dropIndexes();
  await mongoose.connection.db.collection('customers').dropIndexes();
  process.exit(0);
}, 2000);
"

# Then run seed again
npm run seed
```

---

## 🔐 Authentication Errors

### "Not authorized, no token"

**Symptom:** 401 error with message "Not authorized, no token"

**Cause:** JWT token not sent with request.

**Solution:**
```javascript
// Ensure token is included in headers
fetch('/api/orders', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// Or check if user is logged in
if (!customerAuth.isLoggedIn()) {
    window.location.href = 'customer-login.html';
}
```

---

### "Not authorized, token failed"

**Symptom:** 401 error with message "Not authorized, token failed"

**Cause:** Invalid or expired JWT token.

**Solution:**
```javascript
// Clear invalid token and redirect to login
localStorage.removeItem('customerToken');
window.location.href = 'customer-login.html';
```

---

### Login Returns 500 Error

**Symptom:** POST /api/auth/login returns 500 Internal Server Error

**Cause:** Server error, usually database issue.

**Solution:**
```bash
# Check server logs for details
# Common causes:
# 1. User model not found in database
# 2. bcrypt comparison error
# 3. JWT signing error

# Verify JWT_SECRET in server/.env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Test login manually
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

---

### Email Verification Not Working

**Symptom:** Email verification link doesn't work

**Cause:** Token mismatch or expired token.

**Solution:**
```bash
# 1. Check token in URL matches database
# 2. Verify emailVerificationToken field exists
# 3. Check token expiration (24 hours)

# Manually verify user in database
mongo
use yourtown
db.customers.updateOne(
  {email: "user@example.com"},
  {$set: {isEmailVerified: true, emailVerificationToken: null}}
)
```

---

## 💳 Payment Issues

### Stripe Not Loading

**Symptom:** "Stripe is not defined" error

**Cause:** Stripe.js script not loaded or wrong API key.

**Solution:**
```html
<!-- Ensure Stripe.js is loaded -->
<script src="https://js.stripe.com/v3/" async></script>

<script>
// Wait for Stripe to load
const initStripe = async () => {
    if (typeof Stripe === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
        return initStripe();
    }
    stripe = Stripe(config.stripe.publishableKey);
};
initStripe();
</script>
```

```javascript
// Verify publishable key in config.js
stripe: {
    publishableKey: 'pk_test_...' // Must start with pk_test or pk_live
}
```

---

### Payment Intent Creation Fails

**Symptom:** POST /api/payments/create-intent returns 400 error

**Cause:** Invalid amount or missing Stripe secret key.

**Solution:**
```bash
# 1. Check Stripe secret key in server/.env
STRIPE_SECRET_KEY=sk_test_...

# 2. Verify amount is > 0 and in cents
# Example: $10.50 = 1050 cents

# 3. Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u sk_test_your_key:
```

---

### Card Declined

**Symptom:** Payment fails with "Your card was declined"

**Cause:** Using test card incorrectly or real card issue.

**Solution:**
```bash
# Test cards for Stripe:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# Requires Authentication: 4000 0025 0000 3155

# Use any future expiry date and any 3-digit CVC
```

---

## 📧 Email Problems

### Emails Not Sending

**Symptom:** Email functions return success but no email arrives

**Cause:** Email service not configured or wrong credentials.

**Solution:**
```bash
# 1. Check email configuration in server/.env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # NOT your regular password!
EMAIL_FROM="Hometown Delivery <noreply@hometown.com>"

# 2. For Gmail: Enable 2FA and create App Password
# https://myaccount.google.com/apppasswords

# 3. Test email sending
cd server
node test-email.js
```

---

### "Invalid login" Email Error

**Symptom:** `Error: Invalid login: 535-5.7.8 Username and Password not accepted`

**Cause:** Wrong email password or 2FA not configured.

**Solution:**
```bash
# For Gmail:
# 1. Enable 2-Factor Authentication
# 2. Generate App Password at https://myaccount.google.com/apppasswords
# 3. Use App Password (16 characters, no spaces) in EMAIL_PASSWORD

# For SendGrid:
# EMAIL_SERVICE=SendGrid
# EMAIL_USER=apikey
# EMAIL_PASSWORD=your-sendgrid-api-key
```

---

### Emails Go to Spam

**Symptom:** Emails arrive but in spam folder

**Cause:** Poor sender reputation or missing SPF/DKIM.

**Solution:**
```
# Short term:
# - Ask users to whitelist your email
# - Use reputable email service (SendGrid, Mailgun)

# Long term:
# - Set up custom domain
# - Configure SPF records
# - Enable DKIM signing
# - Use authenticated email service
```

---

## 🎨 Frontend Issues

### API Calls Return 404

**Symptom:** `GET http://localhost:3000/api/products 404 (Not Found)`

**Cause:** Wrong API URL or server not running.

**Solution:**
```javascript
// 1. Check api.js baseURL
const API_BASE_URL = 'http://localhost:3000';

// 2. Verify server is running
// Open http://localhost:3000/api/health

// 3. Check browser console for CORS errors
```

---

### Products Not Displaying

**Symptom:** Shop page shows "No products found"

**Cause:** API call failed or database empty.

**Solution:**
```bash
# 1. Check browser console for errors
# 2. Check Network tab for failed requests
# 3. Verify products exist in database

cd server
npm run seed  # Reseed database

# 4. Test API directly
curl http://localhost:3000/api/products
```

---

### Cart Not Persisting

**Symptom:** Cart empties on page refresh

**Cause:** localStorage not working or disabled.

**Solution:**
```javascript
// Check if localStorage is available
if (typeof(Storage) === "undefined") {
    alert("Your browser doesn't support localStorage. Please use a modern browser.");
}

// Check if localStorage is disabled (private browsing)
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
} catch (e) {
    alert("Please disable private browsing mode.");
}

// Clear corrupted cart data
localStorage.removeItem('cart');
location.reload();
```

---

### Images Not Loading

**Symptom:** Broken image icons instead of product images

**Cause:** Invalid Cloudinary URL or images not uploaded.

**Solution:**
```javascript
// 1. Check imageUrl in database
// Should look like: https://res.cloudinary.com/...

// 2. Verify Cloudinary credentials in server/.env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

// 3. Test image URL in browser
// 4. Fallback to emoji if image fails (already implemented)
```

---

### Console Errors About "Undefined"

**Symptom:** `TypeError: Cannot read property 'X' of undefined`

**Cause:** Data not loaded before accessing or API response changed.

**Solution:**
```javascript
// Always check if data exists before accessing
if (order && order.pricing && order.pricing.total) {
    displayTotal(order.pricing.total);
}

// Or use optional chaining
displayTotal(order?.pricing?.total ?? 0);

// Check API response structure in Network tab
```

---

## ⚡ Performance Problems

### Slow Page Load Times

**Symptom:** Pages take > 3 seconds to load

**Cause:** Large bundle sizes or slow API calls.

**Solution:**
```bash
# 1. Build minified assets
npm run build:all

# 2. Check performance budgets
npm run budget

# 3. Analyze bundle sizes
npm run analyze

# 4. Use minified files in production
# Update HTML to use dist/ folder files
```

---

### High Memory Usage

**Symptom:** Server crashes with "JavaScript heap out of memory"

**Cause:** Memory leak or large data processing.

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Or in package.json:
"scripts": {
    "start": "node --max-old-space-size=2048 server.js"
}

# Find memory leaks
npm install -g clinic
clinic doctor -- node server.js
```

---

### Service Worker Not Updating

**Symptom:** Changes not reflected even after deployment

**Cause:** Service worker caching old version.

**Solution:**
```javascript
// 1. Update VERSION in sw.js
const VERSION = 'v2'; // Increment this

// 2. Force update in browser
// DevTools → Application → Service Workers → Unregister
// Then hard refresh (Ctrl+Shift+R)

// 3. Clear all caches
// DevTools → Application → Cache Storage → Delete all

// 4. Users will auto-update on next visit
```

---

## 🚀 Deployment Issues

### Render Service Won't Start

**Symptom:** Deployment successful but service fails health checks

**Cause:** Missing environment variables or wrong start command.

**Solution:**
```bash
# 1. Check all environment variables are set in Render dashboard
# Required: MONGODB_URI, JWT_SECRET, CORS_ORIGIN

# 2. Verify start command
# Build Command: npm install
# Start Command: npm start

# 3. Check logs in Render dashboard
# Look for startup errors

# 4. Test locally with production settings
NODE_ENV=production npm start
```

---

### Database Connection Fails in Production

**Symptom:** `MongoNetworkError` in Render logs

**Cause:** MongoDB Atlas IP whitelist or wrong connection string.

**Solution:**
```bash
# 1. Whitelist Render IPs in MongoDB Atlas
# Network Access → Add IP Address → 0.0.0.0/0 (Allow all)

# 2. Use MongoDB Atlas connection string (not localhost)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yourtown

# 3. Ensure +srv in connection string
# 4. Test connection string locally first
```

---

### Frontend Can't Connect to API

**Symptom:** All API calls fail with network errors

**Cause:** Wrong API URL or CORS misconfiguration.

**Solution:**
```javascript
// 1. Update config.js with production API URL
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://yourtown-delivery-api.onrender.com';

// 2. Ensure CORS_ORIGIN in server includes frontend URL
CORS_ORIGIN=https://yourtown-deliveryfront.onrender.com

// 3. Restart backend service after changing env vars
```

---

## 💻 Development Environment

### Live Server Not Working

**Symptom:** Changes not reflecting or page won't load

**Cause:** Port conflict or VS Code extension issue.

**Solution:**
```bash
# 1. Use Python HTTP server instead
python3 -m http.server 5500

# 2. Or use Node.js http-server
npm install -g http-server
http-server -p 5500

# 3. Check if port 5500 is in use
lsof -i :5500
kill -9 <PID>

# 4. Try different port
python3 -m http.server 8000
```

---

### Git Push Rejected

**Symptom:** `! [rejected] main -> main (non-fast-forward)`

**Cause:** Remote has commits you don't have locally.

**Solution:**
```bash
# 1. Pull latest changes first
git pull origin main

# 2. If conflicts, resolve them
git status
# Edit conflicted files
git add .
git commit -m "Resolve conflicts"

# 3. Then push
git push origin main

# 4. Force push (CAUTION: overwrites remote)
git push -f origin main  # Only if you're sure!
```

---

### NPM Install Fails

**Symptom:** `npm ERR! code ERESOLVE` or dependency conflicts

**Cause:** Package version conflicts.

**Solution:**
```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Use --legacy-peer-deps
npm install --legacy-peer-deps

# 4. Update npm itself
npm install -g npm@latest
```

---

## ⚡ Quick Fixes

### Reset Everything

```bash
# Complete reset (nuclear option)
cd server
rm -rf node_modules package-lock.json
npm install
npm run seed

cd ..
rm -rf node_modules package-lock.json  
npm install
npm run build:all

# Restart both servers
cd server && npm start  # Terminal 1
python3 -m http.server 5500  # Terminal 2
```

---

### Clear All Caches

```bash
# Browser (Chrome DevTools):
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Select "Empty Cache and Hard Reload"

# Or:
# Settings → Privacy → Clear browsing data → Cached images and files

# Service Worker:
# Application → Service Workers → Unregister
# Application → Cache Storage → Delete all
```

---

### Test All Systems

```bash
# 1. Test backend
curl http://localhost:3000/api/health

# 2. Test database
curl http://localhost:3000/api/products

# 3. Test authentication  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# 4. Test frontend
open http://localhost:5500

# 5. Run tests
npm test
npm run lint
```

---

## 📞 Still Having Issues?

### Debug Checklist

- [ ] Check server logs for errors
- [ ] Check browser console for errors  
- [ ] Check Network tab for failed requests
- [ ] Verify all environment variables are set
- [ ] Ensure database is seeded with data
- [ ] Try in incognito/private mode
- [ ] Clear all caches and try again
- [ ] Test with curl/Postman to isolate issue
- [ ] Check GitHub Issues for similar problems
- [ ] Review recent code changes

### Getting Help

1. **Check Documentation:**
   - README.md
   - API_INTEGRATION_COMPLETE.md
   - DEPLOYMENT_GUIDE.md

2. **Search Existing Issues:**
   - GitHub repository issues
   - Stack Overflow
   - Error message in Google

3. **Create Detailed Bug Report:**
   ```
   Environment: Development/Production
   OS: Windows/Mac/Linux
   Browser: Chrome/Firefox/Safari
   Node Version: X.X.X
   Error Message: [Full error text]
   Steps to Reproduce: [Detailed steps]
   Expected Behavior: [What should happen]
   Actual Behavior: [What actually happens]
   ```

---

## 🎓 Pro Tips

1. **Always check server logs first** - Most issues show up there
2. **Use browser DevTools Network tab** - See exactly what requests fail
3. **Test API with curl/Postman** - Isolate backend vs frontend issues
4. **Read error messages carefully** - They usually tell you what's wrong
5. **Check environment variables** - Missing vars cause 80% of deployment issues
6. **Keep dependencies updated** - Run `npm audit fix` regularly
7. **Use git branches** - Never break main with experimental changes
8. **Commit often** - Easy to revert if something breaks
9. **Test locally before deploying** - Catch issues early
10. **Document custom changes** - Future you will thank present you

---

**Last Updated:** January 3, 2026  
**Version:** 1.0  
**Maintained by:** Hometown Delivery Team
