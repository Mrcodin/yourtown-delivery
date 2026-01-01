const mongoose = require('mongoose');
const PromoCode = require('./models/PromoCode');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/hometown-delivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    const promoCode = await PromoCode.findOne({ code: 'WELCOME10' });
    console.log('Found promo code:', promoCode ? promoCode.code : 'NOT FOUND');
    
    if (promoCode) {
      console.log('Promo code details:', {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        isActive: promoCode.isActive
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
