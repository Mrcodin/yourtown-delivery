# 🚀 Production Setup Guide

Complete guide for deploying Yourtown Delivery to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Third-Party Services](#third-party-services)
5. [Deployment](#deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] MongoDB Atlas account (for database)
- [ ] Render account (for hosting)
- [ ] Stripe account (for payments)
- [ ] SendGrid or Mailgun account (for emails)
- [ ] Domain registrar account (for custom domain)

### Local Setup
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] MongoDB Compass (optional, for database management)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Mrcodin/yourtown-delivery.git
cd yourtown-delivery
```

### 2. Configure Environment Variables

Copy the example file:
```bash
cp .env.production.example .env
```

Edit `.env` and fill in your production values. See `.env.production.example` for all available options.

**Critical Variables** (must be set):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ character random string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
EMAIL_SERVICE=SendGrid
EMAIL_API_KEY=SG....
WEBSITE_URL=https://yourdomain.com
```

### 3. Generate Secure Secrets

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate session secret (if needed):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### MongoDB Atlas Production Cluster

1. **Create Production Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Build a Cluster"
   - Choose M10 or higher for production (M0 free tier not recommended)
   - Select region closest to your users
   - Name: `yourtown-production`

2. **Configure Security**
   ```
   Database Access:
   - Create user: yourtown_prod
   - Password: <generate strong password>
   - Role: readWrite on yourtown-delivery database
   
   Network Access:
   - Allow access from anywhere (0.0.0.0/0) OR
   - Add Render's IP addresses
   ```

3. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Add database name: `/yourtown-delivery?retryWrites=true&w=majority`

4. **Create Indexes** (for performance)
   ```javascript
   // Connect to database and run:
   db.products.createIndex({ name: "text", description: "text" });
   db.products.createIndex({ category: 1 });
   db.orders.createIndex({ customerEmail: 1 });
   db.orders.createIndex({ status: 1 });
   db.orders.createIndex({ createdAt: -1 });
   db.users.createIndex({ email: 1 }, { unique: true });
   ```

5. **Seed Initial Data**
   ```bash
   cd server
   npm install
   node seed.js
   ```

6. **Set Up Backups**
   - In Atlas dashboard, go to "Backup"
   - Enable continuous backups
   - Configure backup schedule
   - Test restore procedure

---

## Third-Party Services

### Stripe Payment Processing

1. **Activate Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Complete business verification
   - Activate your account

2. **Get API Keys**
   - Dashboard → Developers → API keys
   - Copy "Publishable key" (starts with `pk_live_`)
   - Copy "Secret key" (starts with `sk_live_`)
   - Add to `.env` file

3. **Set Up Webhooks**
   ```
   Dashboard → Developers → Webhooks → Add endpoint
   
   Endpoint URL: https://your-api.com/api/webhooks/stripe
   
   Events to send:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   
   Copy webhook signing secret → Add to .env as STRIPE_WEBHOOK_SECRET
   ```

4. **Test in Test Mode First**
   - Use test keys first
   - Test with [test cards](https://stripe.com/docs/testing)
   - Verify webhooks receive events

### Email Service (SendGrid)

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com)
   - Sign up for free account (100 emails/day free)

2. **Verify Domain** (recommended)
   ```
   Settings → Sender Authentication → Verify a domain
   Add DNS records to your domain provider
   ```

3. **Create API Key**
   ```
   Settings → API Keys → Create API Key
   Name: Yourtown Production
   Permissions: Full Access (or Mail Send only)
   Copy key → Add to .env as EMAIL_API_KEY
   ```

4. **Set Up Templates** (optional)
   - Email API → Dynamic Templates
   - Create templates for orders, confirmations, etc.

### Cloudinary (Optional - Image Hosting)

1. **Create Account**
   - Go to [Cloudinary](https://cloudinary.com)
   - Sign up for free account

2. **Get Credentials**
   ```
   Dashboard → Account Details
   Copy:
   - Cloud Name
   - API Key
   - API Secret
   Add to .env file
   ```

3. **Configure Upload Presets**
   ```
   Settings → Upload → Upload presets
   Create preset for product images:
   - Folder: products
   - Transform: resize to 800x800
   - Format: auto (WebP when supported)
   ```

---

## Deployment

### Render.com Deployment

#### Backend Deployment

1. **Create Web Service**
   ```
   Render Dashboard → New → Web Service
   
   Connect GitHub repository
   Name: yourtown-api
   Environment: Node
   Region: Choose closest to users
   Branch: main
   
   Build Command: cd server && npm install
   Start Command: node server/server.js
   
   Instance Type: Starter ($7/month) or higher
   ```

2. **Configure Environment Variables**
   ```
   Add all variables from .env file in Render dashboard
   Important: Do NOT use .env file in production
   Set each variable individually in Render
   ```

3. **Set Up Health Checks**
   ```
   Health Check Path: /api/health
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Check logs for errors

#### Frontend Deployment

1. **Build Frontend**
   ```bash
   npm run build:all
   ```

2. **Create Static Site**
   ```
   Render Dashboard → New → Static Site
   
   Name: yourtown-delivery
   Build Command: npm run build:all
   Publish Directory: .
   
   Environment Variables:
   - Add VITE_API_URL (your backend URL)
   - Add VITE_STRIPE_PUBLIC_KEY
   ```

3. **Configure Redirects**
   Create `render.yaml` in root:
   ```yaml
   services:
     - type: web
       name: yourtown-api
       env: node
       buildCommand: cd server && npm install
       startCommand: node server/server.js
       
     - type: web
       name: yourtown-frontend
       env: static
       buildCommand: npm run build:all
       staticPublishPath: .
       routes:
         - type: rewrite
           source: /*
           destination: /index.html
   ```

### Custom Domain Setup

1. **Add Domain in Render**
   ```
   Service Settings → Custom Domain
   Add: yourdomain.com
   Add: www.yourdomain.com
   ```

2. **Update DNS Records**
   ```
   At your domain registrar, add:
   
   Type  | Name | Value
   ------|------|------
   CNAME | www  | yourapp.onrender.com
   A     | @    | [Render's IP addresses]
   ```

3. **Enable HTTPS**
   - Render provides free SSL certificates
   - Automatically enabled for custom domains
   - Force HTTPS in your app

---

## Post-Deployment

### 1. Verify Deployment

**Backend Health Check**
```bash
curl https://your-api.com/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

**Test API Endpoints**
```bash
# Test products
curl https://your-api.com/api/products

# Test authentication (should fail without credentials)
curl https://your-api.com/api/admin/stats
```

**Frontend Check**
- Visit your website
- Check browser console for errors
- Verify assets load correctly
- Test responsive design

### 2. Create Admin Account

```bash
# SSH into your backend server or use MongoDB Compass
# Create admin user in database with hashed password
```

Or use the API:
```bash
curl -X POST https://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@yourbusiness.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

### 3. Test Critical Flows

- [ ] Register new customer account
- [ ] Add products to cart
- [ ] Apply promo code
- [ ] Complete checkout with test card
- [ ] Verify order confirmation email
- [ ] Check order appears in admin dashboard
- [ ] Test order status updates
- [ ] Verify driver assignment
- [ ] Test order tracking

### 4. Load Sample Data

```bash
cd server
node seed.js
```

### 5. Configure Rate Limiting

Verify rate limits are working:
```bash
# Should fail after 5 attempts
for i in {1..10}; do
  curl -X POST https://your-api.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

---

## Monitoring

### Error Tracking (Sentry)

1. **Create Sentry Account**
   - Go to [Sentry.io](https://sentry.io)
   - Create new project
   - Copy DSN

2. **Install Sentry**
   ```bash
   cd server
   npm install @sentry/node
   ```

3. **Configure in server.js**
   ```javascript
   const Sentry = require("@sentry/node");
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   
   // Error handler
   app.use(Sentry.Handlers.errorHandler());
   ```

### Uptime Monitoring

**Options:**
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

**Setup:**
- Monitor: https://your-api.com/api/health
- Check interval: 5 minutes
- Alert: Email/SMS when down

### Performance Monitoring

1. **Google Analytics**
   - Create property
   - Add tracking code to all HTML pages
   - Set up conversion goals

2. **Lighthouse CI**
   ```bash
   npm install -g @lhci/cli
   lhci autorun --upload.target=temporary-public-storage
   ```

### Log Aggregation

**Render Logs:**
- View logs in Render dashboard
- Set up log drains to external service

**Production Logging:**
```javascript
// server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: MongoServerError: Authentication failed
```
**Solution:**
- Check MONGODB_URI is correct
- Verify database user has correct permissions
- Check IP whitelist in MongoDB Atlas

#### 2. Stripe Webhook Not Working
```
Error: Webhook signature verification failed
```
**Solution:**
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook endpoint URL is accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

#### 3. Email Not Sending
```
Error: Invalid API key
```
**Solution:**
- Verify EMAIL_API_KEY is correct
- Check SendGrid account is active
- Verify sender email is authorized

#### 4. CORS Errors
```
Error: CORS policy blocked
```
**Solution:**
- Add frontend URL to CORS_ORIGIN in .env
- Check server/server.js CORS configuration

#### 5. SSL Certificate Issues
```
Error: NET::ERR_CERT_AUTHORITY_INVALID
```
**Solution:**
- Wait for SSL propagation (can take up to 24 hours)
- Clear browser cache
- Check Render SSL certificate status

### Debug Mode

Enable debug logging temporarily:
```env
LOG_LEVEL=debug
NODE_DEBUG=*
```

### Rollback Procedure

If deployment fails:

1. **Revert in Render:**
   ```
   Service → Manual Deploy → Select previous deployment
   ```

2. **Revert code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database rollback:**
   ```
   Restore from MongoDB Atlas backup
   ```

---

## Security Checklist

Before going live:

- [ ] All secrets are environment variables (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] Database user has minimum required permissions
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Input validation is in place
- [ ] SQL injection prevention is active
- [ ] XSS protection is enabled
- [ ] CSRF protection is configured
- [ ] Security headers (Helmet.js) are set
- [ ] Error messages don't expose sensitive info
- [ ] File upload limits are set
- [ ] Authentication timeout is configured

---

## Performance Checklist

- [ ] Images are optimized (WebP format)
- [ ] CSS and JS are minified
- [ ] CDN is configured (optional)
- [ ] Caching headers are set
- [ ] Database indexes are created
- [ ] Connection pooling is enabled
- [ ] Gzip compression is enabled
- [ ] API response caching is implemented
- [ ] Lazy loading is implemented
- [ ] Code splitting is used
- [ ] Service worker is registered

---

## Backup Strategy

### Automated Backups
- MongoDB Atlas: Continuous backups enabled
- Frequency: Every 24 hours
- Retention: 30 days

### Manual Backups
```bash
# Export database
mongodump --uri="mongodb+srv://..." --out=backup-$(date +%Y%m%d)

# Import database
mongorestore --uri="mongodb+srv://..." backup-20260101/
```

### Disaster Recovery Plan
1. Identify issue
2. Assess impact
3. Restore from latest backup
4. Verify data integrity
5. Test critical functionality
6. Monitor for issues

---

## Maintenance Schedule

### Daily
- Check error logs
- Monitor uptime
- Review payment processing

### Weekly
- Review performance metrics
- Check security alerts
- Update dependencies (if needed)

### Monthly
- Security audit
- Performance optimization
- Backup verification
- User feedback review

### Quarterly
- Major dependency updates
- Feature reviews
- Capacity planning
- Disaster recovery test

---

## Support Contacts

- **Technical Issues:** dev@yourbusiness.com
- **Payment Issues:** Stripe Support
- **Email Issues:** SendGrid Support  
- **Hosting Issues:** Render Support

---

## Next Steps

After successful deployment:

1. **Marketing**
   - Set up Google Analytics
   - Create social media accounts
   - Launch marketing campaign

2. **Customer Support**
   - Set up support email
   - Create FAQ page
   - Train support staff

3. **Analytics**
   - Monitor conversion rates
   - Track user behavior
   - Optimize based on data

4. **Iteration**
   - Gather user feedback
   - Plan feature updates
   - Continuous improvement

---

**🎉 Congratulations on launching Yourtown Delivery!**

For questions or issues, refer to the documentation in the `docs/` folder or open an issue on GitHub.
