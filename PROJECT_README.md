# Hometown Delivery - Complete Application

A senior-friendly grocery delivery service with full-stack implementation including Node.js/Express backend, MongoDB database, real-time updates with Socket.io, and Stripe payment processing.

## 🎯 Project Overview

**Frontend**: Static HTML/CSS/JavaScript with senior-friendly UI
**Backend**: Node.js + Express REST API
**Database**: MongoDB Atlas (Cloud)
**Real-time**: Socket.io for live order updates
**Payments**: Stripe integration
**Deployment**: Render (Backend) + Netlify/Vercel (Frontend)

## ✨ Features

### Customer Features
- 🛒 Browse products by category
- 🛍️ Add items to cart with quantity controls
- 📦 "Load My Usual Order" for repeat customers
- 💳 Multiple payment options (Cash, Check, Credit Card with Stripe)
- 📍 Order tracking by phone number
- 🔔 Real-time order status updates
- ♿ Accessibility features (large text, high contrast, read aloud)
- 📞 Phone ordering option

### Admin Dashboard
- 📊 Real-time statistics dashboard
- 📋 Complete order management
- 🚗 Driver management and assignment
- 📦 Product inventory management
- 👥 Customer database
- 📈 Analytics and reports
- 📝 Activity logging
- 💰 Payment tracking
- 🔄 Real-time notifications

### Technical Features
- 🔐 JWT authentication with role-based access
- 🔄 Real-time updates with Socket.io
- 💳 Secure Stripe payment processing
- 📊 Advanced analytics and reporting
- 🛡️ Security best practices (helmet, CORS, rate limiting)
- 📱 Responsive design
- 🌐 RESTful API architecture
- 🗄️ MongoDB with optimized queries

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (free tier)
- Stripe account (for payments)
- Git installed

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/Mrcodin/yourtown-delivery.git
   cd yourtown-delivery
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and Stripe keys
   npm run seed    # Seed database with initial data
   npm run dev     # Start development server
   ```

   Or use the start script:
   ```bash
   cd server
   ./start.sh
   ```

3. **Setup Frontend**
   - Open another terminal
   - Install Live Server extension in VS Code, or
   - Use Python: `python -m http.server 8000`
   - Open `http://localhost:8000` in browser

4. **Test the Application**
   - Browse products at `/shop.html`
   - Login to admin at `/admin-login.html`
   - Default credentials: `admin` / `hometown123`

## 📁 Project Structure

```
yourtown-delivery/
├── server/                      # Backend API
│   ├── config/                  # Configuration
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # API routes
│   ├── scripts/                 # Utility scripts
│   ├── .env.example             # Environment template
│   ├── package.json
│   ├── server.js                # Entry point
│   └── README.md
│
├── *.html                       # Frontend pages
├── *.css                        # Stylesheets
├── *.js                         # Frontend scripts
├── api.js                       # API utility library
├── DEPLOYMENT_GUIDE.md          # Deployment instructions
├── FRONTEND_INTEGRATION_GUIDE.md # Frontend integration
└── README.md                    # This file
```

## 🔑 Default Credentials

After running `npm run seed`:

| Role    | Username | Password     |
|---------|----------|--------------|
| Admin   | admin    | hometown123  |
| Manager | manager  | manager456   |
| Driver  | driver   | driver789    |

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Frontend Integration](FRONTEND_INTEGRATION_GUIDE.md)** - API integration guide
- **[Backend API](server/README.md)** - API documentation

## 🌐 API Endpoints

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-api.onrender.com/api`

### Main Endpoints
- `POST /auth/login` - User login
- `GET /products` - Get all products
- `POST /orders` - Create order
- `GET /orders/track/:phone` - Track order
- `GET /drivers` - Get drivers (Admin)
- `GET /reports/summary` - Dashboard stats (Admin)
- `POST /payments/create-intent` - Create payment
- Full list in [Backend README](server/README.md)

## 🧪 Testing

### Test Stripe Payments
Use these test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Auth**: 4000 0025 0000 3155

### Test Workflow
1. Browse products → Add to cart
2. Checkout with test card
3. Track order with phone number
4. Admin: View/update order
5. Check real-time updates

## 🚀 Deployment

### Backend (Render)
1. Push code to GitHub
2. Create Web Service on Render
3. Connect repository
4. Set environment variables
5. Deploy
6. Seed database via Shell

### Frontend (Netlify/Vercel)
1. Update API URLs in `api.js`
2. Connect repository
3. Deploy as static site
4. Done!

Detailed instructions in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🛠️ Environment Variables

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/yourtown-delivery
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRES_IN=8h
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5500
```

## 📊 Database Schema

- **Users** - Admin/Manager/Driver accounts
- **Products** - Grocery items inventory
- **Customers** - Customer profiles
- **Drivers** - Driver profiles and stats
- **Orders** - Order details and history
- **ActivityLogs** - Audit trail

## 🔒 Security

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based authorization
- ✅ Input validation (express-validator)
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ MongoDB injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: Open GitHub issue
- **Documentation**: Check guides in repo
- **MongoDB**: [Atlas Documentation](https://docs.atlas.mongodb.com)
- **Stripe**: [Stripe Documentation](https://stripe.com/docs)
- **Render**: [Render Documentation](https://render.com/docs)

## 🙏 Acknowledgments

- Built for senior-friendly grocery delivery
- Focus on simplicity and accessibility
- Community-driven local service model

## 📈 Roadmap

- [ ] SMS notifications (Twilio)
- [ ] Email notifications (SendGrid)
- [ ] Push notifications
- [ ] Image upload for products
- [ ] Advanced search and filters
- [ ] Mobile app (React Native)
- [ ] Driver mobile app
- [ ] Inventory management
- [ ] Scheduled deliveries
- [ ] Subscription orders

## 💻 Tech Stack

**Frontend:**
- HTML5/CSS3
- Vanilla JavaScript
- Socket.io Client
- Stripe.js

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- Stripe
- JWT
- bcryptjs

**DevOps:**
- Render (Backend hosting)
- MongoDB Atlas (Database)
- Netlify/Vercel (Frontend hosting)
- GitHub (Version control)

---

**Made with ❤️ for the community**

---

## 🎉 Quick Commands

```bash
# Install dependencies
cd server && npm install

# Seed database
npm run seed

# Start development
npm run dev

# Start production
npm start

# Run with start script
./start.sh
```

---

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
