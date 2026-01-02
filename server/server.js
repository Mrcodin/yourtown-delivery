require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const { 
  apiLimiter, 
  helmetConfig, 
  mongoSanitize, 
  hpp 
} = require('./middleware/security');

// Import models to ensure they're registered
require('./models/PromoCode');
require('./models/Product');
require('./models/Order');
require('./models/Customer');
require('./models/Driver');
require('./models/User');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmetConfig); // Security headers
app.use(mongoSanitize); // Prevent MongoDB injection
app.use(hpp); // Prevent HTTP Parameter Pollution

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with 10MB limit for photo uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer-auth', require('./routes/customerAuth'));
app.use('/api/driver-auth', require('./routes/driverAuth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/promo-codes', require('./routes/promoCodes'));
app.use('/api/usual-orders', require('./routes/usualOrders'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/email', require('./routes/email'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join admin room for order updates
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined room:', socket.id);
  });

  // Join driver room
  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined room:`, socket.id);
  });

  // Join customer tracking room
  socket.on('join-tracking', (phone) => {
    socket.join(`tracking-${phone}`);
    console.log(`Customer ${phone} joined tracking:`, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Socket.io enabled for real-time updates`);
});

module.exports = { app, server, io };
