const UsualOrder = require('../models/UsualOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get all usual orders for a customer
// @route   GET /api/usual-orders
// @access  Public (with phone verification)
exports.getUsualOrders = async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        // Find customer by phone
        const customer = await Customer.findOne({ phone });

        if (!customer) {
            return res.json({
                success: true,
                usualOrders: [],
            });
        }

        // Get usual orders with product details
        const usualOrders = await UsualOrder.find({ customerId: customer._id })
            .populate('items.productId', 'name price emoji imageUrl isTaxable status')
            .sort({ lastUsed: -1, createdAt: -1 });

        // Filter out items with inactive products
        const filteredOrders = usualOrders.map(order => ({
            ...order.toObject(),
            items: order.items.filter(item => item.productId && item.productId.status === 'active'),
        }));

        res.json({
            success: true,
            usualOrders: filteredOrders,
        });
    } catch (error) {
        console.error('Get usual orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching usual orders',
            error: error.message,
        });
    }
};

// @desc    Create usual order
// @route   POST /api/usual-orders
// @access  Public (with phone verification)
exports.createUsualOrder = async (req, res) => {
    try {
        const { name, items, phone } = req.body;

        if (!name || !items || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, items, and phone are required',
            });
        }

        // Find customer by phone
        const customer = await Customer.findOne({ phone });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Validate products
        const validatedItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product || product.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: `Product ${item.productId} is not available`,
                });
            }

            validatedItems.push({
                productId: product._id,
                quantity: item.quantity,
            });
        }

        // Create usual order
        const usualOrder = await UsualOrder.create({
            customerId: customer._id,
            name,
            items: validatedItems,
        });

        // Populate product details
        await usualOrder.populate('items.productId', 'name price emoji imageUrl isTaxable');

        res.status(201).json({
            success: true,
            usualOrder,
        });
    } catch (error) {
        console.error('Create usual order error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating usual order',
            error: error.message,
        });
    }
};

// @desc    Update usual order
// @route   PUT /api/usual-orders/:id
// @access  Public (with phone verification)
exports.updateUsualOrder = async (req, res) => {
    try {
        const { name, items, phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        const usualOrder = await UsualOrder.findById(req.params.id);

        if (!usualOrder) {
            return res.status(404).json({
                success: false,
                message: 'Usual order not found',
            });
        }

        // Verify customer owns this usual order
        const customer = await Customer.findOne({ phone });
        if (!customer || !usualOrder.customerId.equals(customer._id)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this usual order',
            });
        }

        // Update fields
        if (name) usualOrder.name = name;

        if (items) {
            // Validate products
            const validatedItems = [];
            for (const item of items) {
                const product = await Product.findById(item.productId);

                if (!product || product.status !== 'active') {
                    return res.status(400).json({
                        success: false,
                        message: `Product ${item.productId} is not available`,
                    });
                }

                validatedItems.push({
                    productId: product._id,
                    quantity: item.quantity,
                });
            }
            usualOrder.items = validatedItems;
        }

        await usualOrder.save();
        await usualOrder.populate('items.productId', 'name price emoji imageUrl isTaxable');

        res.json({
            success: true,
            usualOrder,
        });
    } catch (error) {
        console.error('Update usual order error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating usual order',
            error: error.message,
        });
    }
};

// @desc    Delete usual order
// @route   DELETE /api/usual-orders/:id
// @access  Public (with phone verification)
exports.deleteUsualOrder = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        const usualOrder = await UsualOrder.findById(req.params.id);

        if (!usualOrder) {
            return res.status(404).json({
                success: false,
                message: 'Usual order not found',
            });
        }

        // Verify customer owns this usual order
        const customer = await Customer.findOne({ phone });
        if (!customer || !usualOrder.customerId.equals(customer._id)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this usual order',
            });
        }

        await usualOrder.deleteOne();

        res.json({
            success: true,
            message: 'Usual order deleted successfully',
        });
    } catch (error) {
        console.error('Delete usual order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting usual order',
            error: error.message,
        });
    }
};

// @desc    Reorder from usual order (add items to cart)
// @route   POST /api/usual-orders/:id/reorder
// @access  Public
exports.reorderUsualOrder = async (req, res) => {
    try {
        const usualOrder = await UsualOrder.findById(req.params.id).populate(
            'items.productId',
            'name price emoji imageUrl isTaxable status'
        );

        if (!usualOrder) {
            return res.status(404).json({
                success: false,
                message: 'Usual order not found',
            });
        }

        // Filter active products and build cart items
        const cartItems = usualOrder.items
            .filter(item => item.productId && item.productId.status === 'active')
            .map(item => ({
                id: item.productId._id.toString(),
                name: item.productId.name,
                price: item.productId.price,
                emoji: item.productId.emoji,
                imageUrl: item.productId.imageUrl,
                quantity: item.quantity,
                isTaxable: item.productId.isTaxable || false,
            }));

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active products available in this usual order',
            });
        }

        // Update lastUsed timestamp
        usualOrder.lastUsed = new Date();
        await usualOrder.save();

        res.json({
            success: true,
            cartItems,
            message: `${cartItems.length} items ready to add to cart`,
        });
    } catch (error) {
        console.error('Reorder usual order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reordering usual order',
            error: error.message,
        });
    }
};

module.exports = exports;
