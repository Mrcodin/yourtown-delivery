// Script to add passwords to existing drivers
require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://localhost:27017/yourtown-delivery',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const addPasswordToDrivers = async () => {
    try {
        await connectDB();

        // Get all drivers without password field
        const drivers = await Driver.find({}).select('+password');

        console.log(`\n📋 Found ${drivers.length} drivers\n`);

        for (const driver of drivers) {
            // Skip if driver already has a password
            if (driver.password && driver.password.length > 0) {
                console.log(`⏭️  ${driver.firstName} ${driver.lastName} already has a password`);
                continue;
            }

            // Set default password (driver's first name + "123")
            const defaultPassword = `${driver.firstName.toLowerCase()}123`;
            driver.password = defaultPassword;

            await driver.save();

            console.log(`✅ ${driver.firstName} ${driver.lastName}`);
            console.log(`   Phone: ${driver.phone}`);
            console.log(`   Password: ${defaultPassword}`);
            console.log(`   (Please change this password after first login)\n`);
        }

        console.log('✅ All drivers updated successfully!');
        console.log('\n📝 Login Instructions:');
        console.log('   1. Go to driver-login.html');
        console.log('   2. Enter phone number and password');
        console.log('   3. Change password after first login\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addPasswordToDrivers();
