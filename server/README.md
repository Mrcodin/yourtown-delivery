# Hometown Delivery - Backend API

Backend REST API for Hometown Delivery service built with Node.js, Express, MongoDB Atlas, Socket.io, and Stripe.

## Features

- ✅ JWT Authentication & Authorization
- ✅ RESTful API endpoints for all resources
- ✅ MongoDB Atlas integration
- ✅ Real-time updates with Socket.io
- ✅ Stripe payment processing
- ✅ Role-based access control (Admin, Manager, Driver)
- ✅ Activity logging and audit trails
- ✅ Data export (CSV)
- ✅ Advanced analytics and reporting
- ✅ Rate limiting and security middleware

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **Payments:** Stripe
- **Validation:** Express Validator
- **Security:** Helmet, CORS, bcryptjs

## Getting Started

### Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account (free tier)
- Stripe account for payments
- npm or yarn package manager

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/yourtown-delivery
   
   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=8h
   
   # Stripe API Keys
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5500
   ```

5. **Seed the database:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Default Credentials

After seeding, use these credentials to log in:

| Role    | Username | Password     |
|---------|----------|--------------|
| Admin   | admin    | hometown123  |
| Manager | manager  | manager456   |
| Driver  | driver   | driver789    |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - Get all products (Public)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin/Manager)
- `PUT /api/products/:id` - Update product (Admin/Manager)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `GET /api/orders` - Get all orders (Admin/Manager)
- `GET /api/orders/:id` - Get single order
- `GET /api/orders/track/:phone` - Track order by phone (Public)
- `POST /api/orders` - Create order (Public)
- `PUT /api/orders/:id/status` - Update order status (Admin/Manager)
- `PUT /api/orders/:id/assign-driver` - Assign driver (Admin/Manager)
- `DELETE /api/orders/:id` - Cancel order (Admin/Manager)

### Customers
- `GET /api/customers` - Get all customers (Admin/Manager)
- `GET /api/customers/:id` - Get single customer
- `GET /api/customers/by-phone/:phone` - Get customer by phone
- `PUT /api/customers/:id` - Update customer (Admin/Manager)
- `GET /api/customers/export/csv` - Export to CSV (Admin/Manager)

### Drivers
- `GET /api/drivers` - Get all drivers (Admin/Manager)
- `GET /api/drivers/:id` - Get single driver
- `GET /api/drivers/:id/orders` - Get driver's orders
- `POST /api/drivers` - Create driver (Admin)
- `PUT /api/drivers/:id` - Update driver (Admin/Manager)
- `PUT /api/drivers/:id/status` - Update driver status
- `DELETE /api/drivers/:id` - Deactivate driver (Admin)

### Reports
- `GET /api/reports/summary` - Get summary statistics (Admin/Manager)
- `GET /api/reports/daily-revenue` - Get daily revenue (Admin/Manager)
- `GET /api/reports/top-products` - Get top selling products (Admin/Manager)
- `GET /api/reports/driver-performance` - Get driver performance (Admin/Manager)
- `GET /api/reports/customer-insights` - Get customer insights (Admin/Manager)

### Activity Logs
- `GET /api/activity-logs` - Get activity logs (Admin)
- `POST /api/activity-logs` - Create activity log (Admin/Manager)

### Payments (Stripe)
- `POST /api/payments/create-intent` - Create payment intent (Public)
- `POST /api/payments/confirm` - Confirm payment (Public)
- `GET /api/payments/status/:paymentIntentId` - Get payment status
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/refund` - Create refund (Admin)

## Socket.io Events

### Server → Client
- `new-order` - New order created
- `order-updated` - Order status changed
- `order-cancelled` - Order cancelled
- `order-status-changed` - Status update for customer tracking
- `order-assigned` - Order assigned to driver
- `driver-status-changed` - Driver status changed
- `payment-received` - Payment completed

### Client → Server
- `join-admin` - Join admin room for real-time updates
- `join-driver` - Join driver room (pass driverId)
- `join-tracking` - Join customer tracking room (pass phone)

## Deployment to Render

### 1. Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Add your IP to the whitelist (or allow from anywhere: 0.0.0.0/0)
5. Get your connection string

### 2. Create Stripe Account

1. Go to [Stripe](https://stripe.com)
2. Create an account
3. Get your API keys from the Dashboard
4. Set up webhook endpoint (add after deployment)

### 3. Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:
   - **Name:** yourtown-delivery-api
   - **Environment:** Node
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Branch:** main

4. Add environment variables in Render dashboard:
   - `PORT` = 10000 (or leave blank for auto)
   - `NODE_ENV` = production
   - `MONGODB_URI` = your-mongodb-atlas-connection-string
   - `JWT_SECRET` = your-secure-random-string
   - `JWT_EXPIRES_IN` = 8h
   - `STRIPE_SECRET_KEY` = sk_live_your_stripe_key
   - `STRIPE_PUBLISHABLE_KEY` = pk_live_your_stripe_key
   - `STRIPE_WEBHOOK_SECRET` = whsec_your_webhook_secret
   - `FRONTEND_URL` = your-frontend-url

5. Deploy the service

6. After deployment, run seed script manually:
   - SSH into Render or use their Shell
   - Run: `npm run seed`

7. Update Stripe webhook URL:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-api-url.onrender.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with initial data

## Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── productController.js # Product CRUD
│   ├── orderController.js   # Order management
│   ├── customerController.js # Customer management
│   ├── driverController.js  # Driver management
│   ├── reportController.js  # Analytics & reports
│   ├── activityLogController.js # Activity logging
│   └── paymentController.js # Stripe payments
├── middleware/
│   ├── auth.js              # JWT verification & authorization
│   └── validation.js        # Request validation
├── models/
│   ├── User.js              # User schema
│   ├── Product.js           # Product schema
│   ├── Customer.js          # Customer schema
│   ├── Driver.js            # Driver schema
│   ├── Order.js             # Order schema
│   └── ActivityLog.js       # Activity log schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── products.js          # Product routes
│   ├── orders.js            # Order routes
│   ├── customers.js         # Customer routes
│   ├── drivers.js           # Driver routes
│   ├── reports.js           # Report routes
│   ├── activityLogs.js      # Activity log routes
│   └── payments.js          # Payment routes
├── scripts/
│   └── seed.js              # Database seeding
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Dependencies
└── server.js                # Express app entry point
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Rate limiting on sensitive endpoints
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Activity logging for audit trails

## Development Tips

1. **Use Postman or Thunder Client** to test API endpoints
2. **Check MongoDB Compass** to view database records
3. **Monitor Socket.io connections** in browser console
4. **Test Stripe payments** with test cards:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002

## Troubleshooting

### Connection Issues
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has proper permissions

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration time
- Clear browser localStorage and re-login

### Stripe Issues
- Use test keys in development
- Verify webhook secret matches
- Check Stripe dashboard for payment status

## Support

For issues or questions:
1. Check the logs in Render dashboard
2. Verify all environment variables are set
3. Test endpoints with Postman
4. Review MongoDB Atlas logs

## License

MIT License - See LICENSE file for details
