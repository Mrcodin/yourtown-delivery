const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hometown_delivery');
    console.log('Connected to MongoDB');
    
    // Must explicitly select password field since it has select: false
    const user = await User.findOne({ username: 'admin' }).select('+password');
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.username);
    console.log('User password field exists:', !!user.password);
    console.log('Password hash:', user.password.substring(0, 20) + '...');
    
    const isMatch = await user.comparePassword('hometown123');
    console.log('Password match for "hometown123":', isMatch);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testLogin();
