const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const { uploadToCloudinary, cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status (default to active for public)
    if (status) {
      query.status = status;
    } else if (!req.user) {
      // Public users only see active products
      query.status = 'active';
    }

    // Search by name or description
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Manager)
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    // Log activity
    await ActivityLog.create({
      type: 'product_add',
      message: `${req.user.name} added product: ${product.name}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { productId: product._id }
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Log activity
    await ActivityLog.create({
      type: 'product_update',
      message: `${req.user.name} updated product: ${product.name}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { productId: product._id }
    });

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'hidden' },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Log activity
    await ActivityLog.create({
      type: 'product_delete',
      message: `${req.user.name} deleted product: ${product.name}`,
      userId: req.user._id,
      username: req.user.username,
      metadata: { productId: product._id }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
      product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Upload product image
// @route   POST /api/products/:id/image
// @access  Private (Admin/Manager)
exports.uploadProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Delete old image from Cloudinary if exists
    if (product.imageUrl) {
      try {
        const publicId = product.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`yourtown-delivery/products/${publicId}`);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    // Upload new image to Cloudinary
    const filename = `${product._id}-${Date.now()}`;
    const result = await uploadToCloudinary(req.file.buffer, filename);

    // Update product with new image URL
    product.imageUrl = result.secure_url;
    await product.save();

    // Log activity
    await ActivityLog.create({
      action: 'product-image-upload',
      userId: req.user._id,
      username: req.user.username,
      metadata: { 
        productId: product._id,
        imageUrl: result.secure_url
      }
    });

    res.json({
      success: true,
      message: 'Product image uploaded successfully',
      imageUrl: result.secure_url,
      product
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading product image',
      error: error.message
    });
  }
};
