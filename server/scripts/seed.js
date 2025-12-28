require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Driver = require('../models/Driver');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Seed Users
const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('⚠️  Users already exist, deleting and reseeding...');
      await User.deleteMany({});
    }

    const users = [
      {
        username: 'admin',
        password: 'hometown123',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@hometowndelivery.com',
        phone: '555-0100'
      },
      {
        username: 'manager',
        password: 'manager456',
        name: 'Manager User',
        role: 'manager',
        email: 'manager@hometowndelivery.com',
        phone: '555-0101'
      },
      {
        username: 'driver',
        password: 'driver789',
        name: 'Test Driver',
        role: 'driver',
        email: 'driver@hometowndelivery.com',
        phone: '555-0102'
      }
    ];

    // Use create instead of insertMany to trigger pre-save hooks
    for (const userData of users) {
      await User.create(userData);
    }
    
    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

// Seed Products (from main.js groceries array)
const seedProducts = async () => {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('⚠️  Products already exist, skipping...');
      return;
    }

    const products = [
      { name: 'Whole Wheat Bread', price: 3.49, category: 'bakery', emoji: '🍞' },
      { name: 'Sourdough Loaf', price: 4.99, category: 'bakery', emoji: '🥖' },
      { name: 'Bagels (6 pack)', price: 3.99, category: 'bakery', emoji: '🥯' },
      { name: 'Croissants (4 pack)', price: 5.49, category: 'bakery', emoji: '🥐' },
      { name: 'Whole Milk (1 gal)', price: 4.29, category: 'dairy', emoji: '🥛' },
      { name: 'Greek Yogurt', price: 1.49, category: 'dairy', emoji: '🥄' },
      { name: 'Cheddar Cheese', price: 4.99, category: 'dairy', emoji: '🧀' },
      { name: 'Butter (1 lb)', price: 5.49, category: 'dairy', emoji: '🧈' },
      { name: 'Large Eggs (dozen)', price: 3.99, category: 'dairy', emoji: '🥚' },
      { name: 'Fresh Apples (lb)', price: 2.49, category: 'produce', emoji: '🍎' },
      { name: 'Bananas (lb)', price: 0.79, category: 'produce', emoji: '🍌' },
      { name: 'Fresh Tomatoes (lb)', price: 2.99, category: 'produce', emoji: '🍅' },
      { name: 'Romaine Lettuce', price: 2.49, category: 'produce', emoji: '🥬' },
      { name: 'Fresh Carrots (lb)', price: 1.49, category: 'produce', emoji: '🥕' },
      { name: 'Broccoli Crown', price: 2.99, category: 'produce', emoji: '🥦' },
      { name: 'Potatoes (5 lb)', price: 4.99, category: 'produce', emoji: '🥔' },
      { name: 'Ground Beef (lb)', price: 6.99, category: 'meat', emoji: '🥩' },
      { name: 'Chicken Breast (lb)', price: 5.99, category: 'meat', emoji: '🍗' },
      { name: 'Salmon Fillet (lb)', price: 12.99, category: 'meat', emoji: '🐟' },
      { name: 'Bacon (12 oz)', price: 7.49, category: 'meat', emoji: '🥓' },
      { name: 'Pasta (16 oz)', price: 1.99, category: 'pantry', emoji: '🍝' },
      { name: 'Rice (2 lb)', price: 3.49, category: 'pantry', emoji: '🍚' },
      { name: 'Canned Tomatoes', price: 1.79, category: 'pantry', emoji: '🥫' },
      { name: 'Olive Oil (16 oz)', price: 8.99, category: 'pantry', emoji: '🫒' },
      { name: 'All-Purpose Flour', price: 4.49, category: 'pantry', emoji: '🌾' },
      { name: 'Sugar (4 lb)', price: 3.99, category: 'pantry', emoji: '🍬' },
      { name: 'Coffee (12 oz)', price: 9.99, category: 'pantry', emoji: '☕' },
      { name: 'Peanut Butter', price: 4.49, category: 'pantry', emoji: '🥜' },
      { name: 'Cereal', price: 4.99, category: 'pantry', emoji: '🥣' },
      { name: 'Canned Soup', price: 2.49, category: 'pantry', emoji: '🍲' },
      { name: 'Frozen Pizza', price: 6.99, category: 'frozen', emoji: '🍕' },
      { name: 'Ice Cream (pint)', price: 4.99, category: 'frozen', emoji: '🍨' },
      { name: 'Frozen Vegetables', price: 2.99, category: 'frozen', emoji: '🥶' },
      { name: 'Orange Juice (64 oz)', price: 4.99, category: 'beverages', emoji: '🍊' },
      { name: 'Apple Juice (64 oz)', price: 3.99, category: 'beverages', emoji: '🧃' },
      { name: 'Soda (2 liter)', price: 2.49, category: 'beverages', emoji: '🥤' },
      { name: 'Bottled Water (24 pk)', price: 5.99, category: 'beverages', emoji: '💧' },
      { name: 'Tea Bags (100 ct)', price: 6.49, category: 'beverages', emoji: '🍵' },
      { name: 'Sports Drink (8 pk)', price: 7.99, category: 'beverages', emoji: '⚡' },
      { name: 'Energy Drink (4 pk)', price: 8.99, category: 'beverages', emoji: '🔋' }
    ];

    await Product.insertMany(products);
    console.log('✅ Products seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }
};

// Seed Drivers
const seedDrivers = async () => {
  try {
    // Check if drivers already exist
    const existingDrivers = await Driver.countDocuments();
    if (existingDrivers > 0) {
      console.log('⚠️  Drivers already exist, skipping...');
      return;
    }

    // Get the driver user account
    const driverUser = await User.findOne({ username: 'driver' });

    const drivers = [
      {
        userId: driverUser ? driverUser._id : null,
        firstName: 'Mary',
        lastName: 'Johnson',
        phone: '555-1234',
        email: 'mary.johnson@example.com',
        vehicle: {
          type: 'suv',
          description: 'Blue Honda CR-V',
          licensePlate: 'ABC123'
        },
        status: 'online',
        rating: 4.9,
        totalDeliveries: 234,
        earnings: 936,
        payRate: 4.00,
        joinDate: new Date('2024-01-15')
      },
      {
        firstName: 'Tom',
        lastName: 'Rodriguez',
        phone: '555-5678',
        email: 'tom.rodriguez@example.com',
        vehicle: {
          type: 'truck',
          description: 'Red Ford F-150',
          licensePlate: 'XYZ789'
        },
        status: 'busy',
        rating: 4.8,
        totalDeliveries: 189,
        earnings: 756,
        payRate: 4.00,
        joinDate: new Date('2024-02-20')
      },
      {
        firstName: 'Susan',
        lastName: 'Williams',
        phone: '555-9012',
        email: 'susan.williams@example.com',
        vehicle: {
          type: 'car',
          description: 'Silver Toyota Camry',
          licensePlate: 'DEF456'
        },
        status: 'online',
        rating: 5.0,
        totalDeliveries: 156,
        earnings: 624,
        payRate: 4.00,
        joinDate: new Date('2024-03-10')
      },
      {
        firstName: 'James',
        lastName: 'Brown',
        phone: '555-3456',
        email: 'james.brown@example.com',
        vehicle: {
          type: 'van',
          description: 'White Ford Transit',
          licensePlate: 'GHI789'
        },
        status: 'offline',
        rating: 4.7,
        totalDeliveries: 98,
        earnings: 392,
        payRate: 4.00,
        joinDate: new Date('2024-04-05')
      }
    ];

    await Driver.insertMany(drivers);
    console.log('✅ Drivers seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding drivers:', error.message);
  }
};

// Main seed function
const seedAll = async () => {
  console.log('🌱 Starting database seeding...\n');
  
  await connectDB();
  
  await seedUsers();
  await seedProducts();
  await seedDrivers();
  
  console.log('\n✅ Database seeding completed!');
  console.log('\nDefault Login Credentials:');
  console.log('----------------------------');
  console.log('Admin:   username: admin    | password: hometown123');
  console.log('Manager: username: manager  | password: manager456');
  console.log('Driver:  username: driver   | password: driver789');
  
  mongoose.connection.close();
  process.exit(0);
};

// Run seeder
seedAll();
