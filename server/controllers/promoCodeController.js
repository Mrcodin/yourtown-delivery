const PromoCode = require('../models/PromoCode');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all promo codes
// @route   GET /api/promo-codes
// @access  Private (Admin/Manager)
exports.getPromoCodes = async (req, res) => {
    try {
        const promoCodes = await PromoCode.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: promoCodes.length,
            promoCodes,
        });
    } catch (error) {
        console.error('Get promo codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching promo codes',
            error: error.message,
        });
    }
};

// @desc    Validate promo code
// @route   POST /api/promo-codes/validate
// @access  Public
exports.validatePromoCode = async (req, res) => {
    try {
        const { code, orderAmount, customerId } = req.body;

        console.log('🎟️  Validating promo code:', { code, orderAmount, customerId });

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a promo code',
            });
        }

        // Debug: Check collection and connection
        console.log('📊 PromoCode model collection:', PromoCode.collection.name);
        console.log('📊 Connection state:', PromoCode.db.readyState);

        // Count all promo codes
        const count = await PromoCode.countDocuments();
        console.log('📊 Total promo codes in collection:', count);

        // Try to find all codes first
        const allCodes = await PromoCode.find({}).limit(5);
        console.log(
            '📊 Sample promo codes:',
            allCodes.map(p => p.code)
        );

        // Find promo code (case insensitive)
        const promoCode = await PromoCode.findOne({
            code: code.toUpperCase(),
        });

        console.log('🔍 Found promo code:', promoCode ? promoCode.code : 'NOT FOUND');

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Invalid promo code',
            });
        }

        // Check if code is valid
        const validation = promoCode.isValid(customerId, orderAmount || 0);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
            });
        }

        // Calculate discount
        const discount = promoCode.calculateDiscount(orderAmount || 0);

        res.json({
            success: true,
            message: 'Promo code is valid',
            promoCode: {
                _id: promoCode._id,
                code: promoCode.code,
                description: promoCode.description,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                minimumOrderAmount: promoCode.minimumOrderAmount,
            },
            discount,
        });
    } catch (error) {
        console.error('Validate promo code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating promo code',
            error: error.message,
        });
    }
};

// @desc    Create promo code
// @route   POST /api/promo-codes
// @access  Private (Admin/Manager)
exports.createPromoCode = async (req, res) => {
    try {
        const promoCodeData = {
            ...req.body,
            code: req.body.code.toUpperCase(),
            createdBy: req.user._id,
        };

        const promoCode = await PromoCode.create(promoCodeData);

        // Log activity
        await ActivityLog.create({
            type: 'promo_created',
            user: req.user._id,
            message: `Promo code ${promoCode.code} created`,
            metadata: { promoCodeId: promoCode._id },
        });

        res.status(201).json({
            success: true,
            message: 'Promo code created successfully',
            promoCode,
        });
    } catch (error) {
        console.error('Create promo code error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A promo code with this code already exists',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating promo code',
            error: error.message,
        });
    }
};

// @desc    Update promo code
// @route   PUT /api/promo-codes/:id
// @access  Private (Admin/Manager)
exports.updatePromoCode = async (req, res) => {
    try {
        let promoCode = await PromoCode.findById(req.params.id);

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found',
            });
        }

        // Update promo code
        promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Log activity
        await ActivityLog.create({
            type: 'promo_updated',
            user: req.user._id,
            message: `Promo code ${promoCode.code} updated`,
            metadata: { promoCodeId: promoCode._id },
        });

        res.json({
            success: true,
            message: 'Promo code updated successfully',
            promoCode,
        });
    } catch (error) {
        console.error('Update promo code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating promo code',
            error: error.message,
        });
    }
};

// @desc    Delete promo code
// @route   DELETE /api/promo-codes/:id
// @access  Private (Admin/Manager)
exports.deletePromoCode = async (req, res) => {
    try {
        const promoCode = await PromoCode.findById(req.params.id);

        if (!promoCode) {
            return res.status(404).json({
                success: false,
                message: 'Promo code not found',
            });
        }

        await promoCode.deleteOne();

        // Log activity
        await ActivityLog.create({
            type: 'promo_deleted',
            user: req.user._id,
            message: `Promo code ${promoCode.code} deleted`,
            metadata: { code: promoCode.code },
        });

        res.json({
            success: true,
            message: 'Promo code deleted successfully',
        });
    } catch (error) {
        console.error('Delete promo code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting promo code',
            error: error.message,
        });
    }
};
