// Script to fix email index to be sparse (allows multiple null values)
require('dotenv').config();
const mongoose = require('mongoose');

async function fixEmailIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://localhost:27017/yourtown-delivery'
        );
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const customersCollection = db.collection('customers');

        // Get existing indexes
        const indexes = await customersCollection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(idx => console.log(` - ${idx.name}:`, idx.key));

        // Drop the old email index if it exists and is not sparse
        const emailIndex = indexes.find(idx => idx.key.email === 1);
        if (emailIndex && !emailIndex.sparse) {
            console.log('\n🗑️  Dropping non-sparse email index...');
            await customersCollection.dropIndex('email_1');
            console.log('✅ Old email index dropped');
        }

        // Create new sparse index on email
        console.log('\n✨ Creating sparse email index...');
        await customersCollection.createIndex(
            { email: 1 },
            {
                unique: true,
                sparse: true, // Allows multiple documents without email
                name: 'email_1',
            }
        );
        console.log('✅ Sparse email index created');

        // Verify the new index
        const newIndexes = await customersCollection.indexes();
        const newEmailIndex = newIndexes.find(idx => idx.key.email === 1);
        console.log('\n✅ Email index is now:', newEmailIndex);

        console.log('\n✅ Email index fix complete!');
        console.log('   - Guest orders (without email) will now work correctly');
        console.log('   - Multiple customers can place orders without providing email');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing email index:', error);
        process.exit(1);
    }
}

fixEmailIndex();
