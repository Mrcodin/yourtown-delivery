const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['bakery', 'dairy', 'produce', 'meat', 'pantry', 'frozen', 'beverages'],
    lowercase: true
  },
  emoji: {
    type: String,
    default: '📦'
  },
  imageUrl: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'out-of-stock', 'hidden'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
