# 🏪 Yourtown Delivery - Full-Stack Delivery Platform

A complete delivery management system with real-time order tracking, admin dashboard, and MongoDB backend.

## 🌐 Live Demo

- **Customer Shop**: [https://yourtown-deliveryfront.onrender.com](https://yourtown-deliveryfront.onrender.com)
- **Admin Panel**: [https://yourtown-deliveryfront.onrender.com/admin-login.html](https://yourtown-deliveryfront.onrender.com/admin-login.html)
- **API**: [https://yourtown-delivery-api.onrender.com/api](https://yourtown-delivery-api.onrender.com/api)

## ✨ Features

### Customer Features
- 🛒 Browse 40+ products across 6 categories (Bakery, Dairy, Produce, Meat, Pantry, Beverages, Frozen)
- 🛍️ Shopping cart with persistent storage
- 📱 Real-time order tracking by phone number
- 💳 Multiple payment methods (Cash, Credit Card, Debit Card)
- 🚚 Delivery time selection (ASAP or Scheduled)

### Admin Dashboard
- 📊 Real-time statistics and analytics
- 📦 Order management with status updates
- 👥 Customer database with purchase history
- 🚗 Driver management and assignment
- 📈 Sales reports and trends
- 🏷️ Product catalog management
- 🔐 Role-based access control (Admin, Manager, Driver)

### Technical Features
- ⚡ Real-time updates with Socket.io
- 🔒 JWT authentication & authorization
- 🗄️ MongoDB database with Mongoose ODM
- 🎨 Responsive design (mobile-friendly)
- 🔄 RESTful API with 38 endpoints
- 🛡️ Security: Helmet, CORS, Rate Limiting
- 📝 Activity logging for all actions

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Socket.io Client for real-time updates
- Fetch API for HTTP requests

### Backend
- Node.js v18+
- Express.js v4.18.2
- MongoDB + Mongoose v8.0.3
- Socket.io v4.6.1
- JWT (jsonwebtoken v9.0.2)
- bcryptjs v2.4.3
- Stripe v14.10.0

### Deployment
- **Frontend**: Render Static Site
- **Backend**: Render Web Service
- **Database**: MongoDB Atlas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Mrcodin/yourtown-delivery.git
cd yourtown-delivery
```

2. **Set up backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run seed    # Seed database with sample data
npm start       # Start backend on port 3000
```

3. **Set up frontend**
```bash
# In project root directory
python3 -m http.server 5500
# Or use any static file server
```

4. **Access the application**
- Customer Shop: http://localhost:5500/index.html
- Admin Panel: http://localhost:5500/admin-login.html
- API: http://localhost:3000/api

## 🔑 Default Credentials

| Role    | Username | Password     |
|---------|----------|--------------|
| Admin   | admin    | hometown123  |
| Manager | manager  | manager456   |
| Driver  | driver   | driver789    |

**⚠️ Change these passwords in production!**

## 📁 Project Structure

```
yourtown-delivery/
├── server/                 # Backend Node.js application
│   ├── config/            # Database configuration
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth & validation
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── scripts/           # Seed script
│   └── server.js          # Entry point
├── *.html                 # Frontend pages
├── *.css                  # Stylesheets
├── *.js                   # Frontend JavaScript
├── api.js                 # API wrapper
├── auth.js                # Authentication
├── admin.js               # Admin panel logic
└── main.js                # Shop logic
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get all orders (Admin/Manager)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/assign` - Assign driver

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get single driver
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `PUT /api/drivers/:id/status` - Update driver status

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/orders` - Order statistics
- `GET /api/reports/customers` - Customer analytics

[View full API documentation →](API_INTEGRATION_COMPLETE.md)

## 🎯 Deployment

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Render

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **Deploy Backend**
- Go to [Render Dashboard](https://dashboard.render.com)
- Create new Web Service from GitHub repo
- Set root directory to `server`
- Add environment variables (MongoDB URI, JWT secret, CORS origin)

3. **Deploy Frontend**
- Create new Static Site from same repo
- Root directory: `.` (root)
- No build command needed

4. **Seed Database**
```bash
cd server
MONGODB_URI="your-production-uri" npm run seed
```

## 📚 Documentation

- [Complete API Integration Guide](API_INTEGRATION_COMPLETE.md)
- [Frontend Integration Guide](FRONTEND_INTEGRATION_GUIDE.md)
- [Admin API Integration](ADMIN_API_INTEGRATION.md)
- [Deployment Guide](RENDER_DEPLOYMENT.md)
- [Quick Start Guide](QUICK_START.md)

## 🧪 Testing

### Test API Health
```bash
curl https://yourtown-delivery-api.onrender.com/api/health
```

### Test Login
```bash
curl -X POST https://yourtown-delivery-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"hometown123"}'
```

## 🔒 Security Features

- ✅ JWT authentication with 8-hour expiration
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation
- ✅ MongoDB injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with Express.js and MongoDB
- Deployed on Render
- Real-time updates powered by Socket.io

Your live URLs:

Customer Shop: https://yourtown-deliveryfront.onrender.com
Admin Panel: https://yourtown-deliveryfront.onrender.com/admin-login.html
API: https://yourtown-delivery-api.onrender.com/api

## 📧 Contact

Project Link: [https://github.com/Mrcodin/yourtown-delivery](https://github.com/Mrcodin/yourtown-delivery)

---

Made with ❤️ by Mrcodin
