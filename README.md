# 🏪 Yourtown Delivery - Production-Ready Delivery Platform

[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen)](https://github.com/Mrcodin/yourtown-delivery)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-6.0+-green)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A complete, production-ready grocery delivery platform with real-time tracking, comprehensive admin dashboard, customer accounts, driver management, and advanced performance optimizations.

## 🌟 Live Demo

- **🛒 Customer Shop**: [https://yourtown-deliveryfront.onrender.com](https://yourtown-deliveryfront.onrender.com)
- **👨‍💼 Admin Dashboard**: [https://yourtown-deliveryfront.onrender.com/admin-login.html](https://yourtown-deliveryfront.onrender.com/admin-login.html)
- **🔌 API Documentation**: [https://yourtown-delivery-api.onrender.com/api-docs](https://yourtown-delivery-api.onrender.com/api-docs)

## ✨ Key Features

### 🛍️ Customer Experience
- **Shopping Cart**: Browse 48+ products across 8 categories
- **Customer Accounts**: Registration, email verification, password reset
- **Order History**: View past orders and reorder favorites
- **Multiple Payment Methods**: Cash, Stripe credit/debit cards
- **Promo Codes**: Apply discount codes at checkout
- **Real-time Tracking**: Track order status from placement to delivery

### 👨‍💼 Admin Dashboard
- **Real-time Analytics**: Sales trends, revenue charts, customer insights
- **Order Management**: Update status, assign drivers
- **Customer Database**: Complete profiles with purchase history
- **Driver Management**: Real-time status tracking
- **Product Catalog**: Full CRUD with Cloudinary image support
- **Email Notifications**: Automated order confirmations
- **Reports & Analytics**: Comprehensive business metrics

### ⚡ Technical Excellence
- **Performance**: Lighthouse score 95/100
- **Security**: JWT auth, rate limiting, Helmet.js
- **Real-time**: Socket.io for live updates
- **Offline Support**: Service worker caching
- **Mobile-First**: Responsive design
- **CDN Ready**: Configured for global deployment

## 🏆 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Paint | 2.1s | 0.6s | ⚡ **71% faster** |
| Time to Interactive | 4.5s | 1.2s | ⚡ **73% faster** |
| Page Size | 8.5MB | 2.1MB | 📦 **75% smaller** |
| Lighthouse | 62 | 95 | ⭐ **+33 points** |

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Socket.io Client, Service Workers
- Code Splitting, Lazy Loading, WebP Images

### Backend
- Node.js 18+, Express.js 4.18+
- MongoDB 6.0+ with Mongoose
- JWT, bcrypt, Stripe SDK
- Socket.io, Nodemailer, Cloudinary

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Mrcodin/yourtown-delivery.git
cd yourtown-delivery
cd server && npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Stripe keys
```

### 3. Seed Database
```bash
npm run seed
# Save the generated admin password!
```

### 4. Start Servers
```bash
# Terminal 1: Backend (port 3000)
npm start

# Terminal 2: Frontend (port 8080)
cd .. && python3 -m http.server 8080
```

### 5. Access Application
- Shop: http://localhost:8080/shop.html
- Admin: http://localhost:8080/admin.html
- API: http://localhost:3000/api/health

## 📖 Documentation

### Getting Started
- [Quick Start Guide](docs/guides/QUICK_START.md)
- [Deployment Guide](docs/setup/DEPLOYMENT_GUIDE.md)
- [Customization Guide](docs/guides/CUSTOMIZATION_GUIDE.md)

### Setup & Configuration
- [Email Setup](docs/setup/EMAIL_SETUP_GUIDE.md)
- [Stripe Integration](docs/setup/STRIPE_SETUP_GUIDE.md)
- [Cloudinary Setup](docs/setup/CLOUDINARY_SETUP.md)
- [CDN Setup](docs/setup/CDN_SETUP_GUIDE.md)

### Development
- [API Documentation](docs/api/API_INTEGRATION_COMPLETE.md)
- [Frontend Guide](docs/api/FRONTEND_INTEGRATION_GUIDE.md)
- [Testing Guide](docs/guides/TESTING_GUIDE.md)

### Performance & Security
- [Performance Guide](docs/performance/PERFORMANCE_OPTIMIZATION.md)
- [Security Guide](docs/guides/SECURITY_GUIDE.md)

## 🔑 Default Credentials

After running `npm run seed`, check console for generated admin password.

| Role | Username | Notes |
|------|----------|-------|
| Admin | admin | Full system access |
| Manager | manager | Order & inventory |
| Driver | driver | Delivery management |

**⚠️ Change passwords in production!**

## 🔌 API Overview

- **Authentication** - `/api/auth/*`
- **Products** - `/api/products/*`
- **Orders** - `/api/orders/*`
- **Customers** - `/api/customers/*`
- **Drivers** - `/api/drivers/*`
- **Payments** - `/api/payments/*`
- **Promo Codes** - `/api/promo-codes/*`
- **Analytics** - `/api/analytics/*`

[Full API Documentation →](docs/api/API_INTEGRATION_COMPLETE.md)

## 📁 Project Structure

```
yourtown-delivery/
├── server/              # Node.js backend
│   ├── config/         # Database config
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth & validation
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── docs/               # Documentation
│   ├── setup/         # Setup guides
│   ├── api/           # API docs
│   ├── guides/        # User guides
│   └── performance/   # Performance docs
├── css/               # Stylesheets
├── js/                # JavaScript modules
├── *.html            # Frontend pages
└── test-files/       # Development tests
```

## 🔐 Security Features

✅ JWT authentication with 8-hour expiration  
✅ Bcrypt password hashing (10 rounds)  
✅ Role-based access control  
✅ Email verification  
✅ Rate limiting (100 req/15min)  
✅ Helmet.js security headers  
✅ MongoDB injection prevention  
✅ XSS protection  

## 🎯 Deployment

### Render (Recommended)

1. Push to GitHub
2. Create Web Service (backend): `server` directory
3. Create Static Site (frontend): root directory
4. Add environment variables
5. Seed database: `npm run seed`

[Complete Deployment Guide →](docs/setup/DEPLOYMENT_GUIDE.md)

## ⚙️ Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Optional
STRIPE_SECRET_KEY=sk_live_...
EMAIL_USER=noreply@yourbusiness.com
EMAIL_PASSWORD=app-password
CLOUDINARY_CLOUD_NAME=your-cloud
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Performance audit
npm run lighthouse

# Load testing
npm run test:load
```

## 🎨 Customization

Edit `config.js` for branding:
```javascript
const CONFIG = {
    businessName: 'Your Business',
    phone: '555-123-4567',
    email: 'contact@yourbusiness.com'
};
```

[Customization Guide →](docs/guides/CUSTOMIZATION_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/Amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/Amazing`)
5. Open Pull Request

## 🐛 Troubleshooting

**MongoDB connection issues?**
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas

**Products not loading?**
- Ensure backend is running (port 3000)
- Check browser console for errors

[Full Troubleshooting Guide →](docs/guides/TROUBLESHOOTING.md)

## 📈 Monitoring

```bash
# API health
curl https://your-api.com/api/health

# Performance
npm run analyze
```

## 📄 License

MIT License - see LICENSE file

## 👏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.io](https://socket.io/)
- [Stripe](https://stripe.com/)
- [Cloudinary](https://cloudinary.com/)
- [Render](https://render.com/)

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/Mrcodin/yourtown-delivery/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Mrcodin/yourtown-delivery/discussions)

## 🚀 Roadmap

- [ ] Mobile apps (React Native)
- [ ] SMS notifications (Twilio)
- [ ] Loyalty points program
- [ ] Referral system
- [ ] Multi-language support
- [ ] Dark mode

---

**Made with ❤️ by [Mrcodin](https://github.com/Mrcodin)**

**⭐ Star this repo if you find it helpful!**

![GitHub stars](https://img.shields.io/github/stars/Mrcodin/yourtown-delivery)
![GitHub forks](https://img.shields.io/github/forks/Mrcodin/yourtown-delivery)
![GitHub issues](https://img.shields.io/github/issues/Mrcodin/yourtown-delivery)
