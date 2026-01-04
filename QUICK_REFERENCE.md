# 📚 Quick Reference Guide

Fast reference for common tasks and information.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Mrcodin/yourtown-delivery.git
cd yourtown-delivery

# Backend setup
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
node seed.js
npm start

# Frontend (separate terminal)
cd ..
npm install
# Serve with your preferred static server (Live Server, http-server, etc.)
```

## 📁 Project Structure

```
yourtown-delivery/
├── server/              # Backend (Node.js + Express + MongoDB)
├── docs/                # Documentation (organized by category)
│   ├── setup/          # Deployment & setup guides
│   ├── api/            # API documentation
│   ├── guides/         # User & developer guides
│   ├── performance/    # Performance optimization
│   └── archive/        # Historical logs
├── test-files/         # Test & debug files
├── build-scripts/      # Build tools (minify, optimize)
├── js/                 # Frontend JavaScript modules
└── css/                # CSS stylesheets
```

## 🔑 Environment Variables

See [.env.production.example](.env.production.example) for complete list.

**Essential Variables:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ char random string>
STRIPE_SECRET_KEY=sk_live_...
EMAIL_SERVICE=SendGrid
EMAIL_API_KEY=SG....
WEBSITE_URL=https://yourdomain.com
```

## 🛠️ Common Commands

```bash
# Build all assets
npm run build:all

# Build CSS only
npm run build:css

# Build JavaScript only
npm run build:js

# Optimize images (WebP)
npm run build:images

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean

# Run organization script
npm run organize

# Performance analysis
npm run analyze
npm run budget

# Lighthouse audit
npm run lighthouse
```

## 📡 API Endpoints

**Base URL:** `/api`

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get by category
- `POST /api/admin/products` - Create product (admin)
- `PUT /api/admin/products/:id` - Update product (admin)
- `DELETE /api/admin/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status (admin)

### Promo Codes
- `POST /api/promo/validate` - Validate promo code
- `POST /api/admin/promo` - Create promo (admin)

### Stats
- `GET /api/stats` - Get homepage statistics
- `GET /api/admin/stats` - Get admin dashboard stats (admin)

See [API Documentation](docs/api/API_INTEGRATION_COMPLETE.md) for details.

## 🔒 Authentication

**JWT Token:** Stored in localStorage as `token`

**Headers:**
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 💳 Stripe Testing

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
Any future expiry date
Any 3-digit CVC
```

## 📧 Email Templates

Located in: `server/utils/emailTemplates.js`

**Available Templates:**
- Order Confirmation
- Order Status Update
- Delivery Notification
- Admin New Order Alert
- Welcome Email
- Password Reset

## 🐛 Debugging

**Enable debug mode:**
```javascript
// In browser console
localStorage.setItem('debug', 'true');

// Or add ?debug=true to URL
```

**View logs:**
```bash
# Backend logs (in server directory)
tail -f logs/error.log
tail -f logs/combined.log
```

## 🚨 Common Issues

### Database Connection Failed
```bash
# Check MongoDB URI in .env
# Verify network access in MongoDB Atlas
# Check database user permissions
```

### Stripe Webhook Not Working
```bash
# Test locally with Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Verify webhook secret in .env matches Stripe dashboard
```

### CORS Errors
```javascript
// Add your frontend URL to CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5500,https://yourdomain.com
```

## 📊 Performance Targets

- Lighthouse Score: 90+
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.8s
- Total Bundle Size: < 500KB
- Image Optimization: WebP with fallbacks

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials not in code
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Helmet.js security headers set
- [ ] Error messages don't expose sensitive info

## 📦 Dependencies

**Backend:**
- express 4.18+
- mongoose 8.0+
- jsonwebtoken 9.0+
- bcryptjs 2.4+
- stripe 14.10+
- nodemailer 6.9+

**Frontend:**
- Vanilla JavaScript (no framework)
- Socket.io-client 4.7+
- Stripe.js

**Dev:**
- eslint 9.39+
- prettier 3.7+
- terser 5.44+ (minification)
- clean-css 5.3+ (CSS minification)

## 🔗 Important Links

**Documentation:**
- [README](README.md) - Main documentation
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
- [Production Setup](docs/setup/PRODUCTION_SETUP.md) - Deployment guide
- [Production Readiness](PRODUCTION_READINESS.md) - Production checklist
- [Cleanup Summary](CLEANUP_SUMMARY.md) - Recent changes

**Guides:**
- [Security Guide](docs/guides/SECURITY_GUIDE.md)
- [Customization Guide](docs/guides/CUSTOMIZATION_GUIDE.md)
- [Feature Guide](docs/guides/FEATURE_GUIDE.md)

**Setup:**
- [Stripe Setup](docs/setup/STRIPE_SETUP_GUIDE.md)
- [Email Setup](docs/setup/EMAIL_SETUP_GUIDE.md)
- [Cloudinary Setup](docs/setup/CLOUDINARY_SETUP.md)
- [Render Deployment](docs/setup/RENDER_DEPLOYMENT.md)

## 🎯 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Customer Accounts | ✅ Complete | Register, login, profile |
| Product Catalog | ✅ Complete | 48+ products, 8 categories |
| Shopping Cart | ✅ Complete | Persistent, real-time |
| Checkout | ✅ Complete | Stripe integration |
| Promo Codes | ✅ Complete | Percentage & fixed |
| Order Tracking | ✅ Complete | Real-time Socket.io |
| Email Notifications | ✅ Complete | All order events |
| Admin Dashboard | ✅ Complete | Full management |
| Driver Management | ✅ Complete | Assignment, tracking |
| Analytics | ✅ Complete | Revenue, products, customers |
| Mobile Responsive | ✅ Complete | Touch-friendly |
| Service Worker | ✅ Complete | Offline support |
| Performance | ✅ Complete | 95 Lighthouse score |
| Security | ✅ Complete | Rate limiting, JWT |

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: [GitHub Issues](https://github.com/Mrcodin/yourtown-delivery/issues)
- **Email**: support@yourbusiness.com

## 🔄 Deployment

**Render.com (Recommended):**
```bash
# Connect GitHub repository in Render dashboard
# Set environment variables in Render
# Deploy automatically on push to main
```

See [Production Setup Guide](docs/setup/PRODUCTION_SETUP.md) for details.

## 🧪 Testing

```bash
# Test API health
curl http://localhost:3000/api/health

# Test products endpoint
curl http://localhost:3000/api/products

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 📈 Monitoring

**Recommended Services:**
- Error Tracking: [Sentry](https://sentry.io)
- Uptime Monitoring: [UptimeRobot](https://uptimerobot.com)
- Analytics: [Google Analytics](https://analytics.google.com)
- Performance: [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Need more help?** Check the [full documentation](README.md) or open an issue on GitHub!
