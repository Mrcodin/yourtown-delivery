const Driver = require('../models/Driver');
const Order = require('../models/Order');

// @desc    Driver login
// @route   POST /api/driver-auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({ message: 'Please provide phone and password' });
        }

        // Clean phone number (remove spaces, dashes, parentheses, etc.)
        const cleanPhone = phone.replace(/\D/g, '');

        // Try multiple phone formats to match database
        const phoneFormats = [
            phone, // As provided
            cleanPhone, // Digits only
        ];

        // Add formatted versions based on length
        if (cleanPhone.length === 7) {
            phoneFormats.push(`${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`); // xxx-xxxx
        } else if (cleanPhone.length === 10) {
            // Full 10-digit formats
            phoneFormats.push(
                `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
            ); // xxx-xxx-xxxx
            phoneFormats.push(
                `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
            ); // (xxx) xxx-xxxx

            // Also try first 7 digits (for local numbers stored as 7 digits)
            const first7 = cleanPhone.slice(0, 7);
            phoneFormats.push(first7); // xxxxxxx
            phoneFormats.push(`${first7.slice(0, 3)}-${first7.slice(3)}`); // xxx-xxxx
        }

        // Find driver by phone and include password
        const driver = await Driver.findOne({
            phone: { $in: phoneFormats },
        }).select('+password');

        if (!driver) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        // Check if driver is inactive
        if (driver.status === 'inactive') {
            return res
                .status(401)
                .json({ message: 'Your account is inactive. Please contact admin.' });
        }

        // Check password
        const isMatch = await driver.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        // Update status to online
        driver.status = 'online';
        await driver.save();

        // Generate token
        const token = driver.getSignedJwtToken();

        res.json({
            success: true,
            token,
            driver: {
                id: driver._id,
                firstName: driver.firstName,
                lastName: driver.lastName,
                phone: driver.phone,
                email: driver.email,
                status: driver.status,
                rating: driver.rating,
                totalDeliveries: driver.totalDeliveries,
                earnings: driver.earnings,
                payRate: driver.payRate,
            },
        });
    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Driver logout
// @route   POST /api/driver-auth/logout
// @access  Private (Driver)
exports.logout = async (req, res) => {
    try {
        // Update driver status to offline
        await Driver.findByIdAndUpdate(req.driver.id, { status: 'offline' });

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Driver logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

// @desc    Get current driver profile
// @route   GET /api/driver-auth/me
// @access  Private (Driver)
exports.getMe = async (req, res) => {
    try {
        const driver = await Driver.findById(req.driver.id);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.json({
            success: true,
            driver: {
                id: driver._id,
                firstName: driver.firstName,
                lastName: driver.lastName,
                phone: driver.phone,
                email: driver.email,
                status: driver.status,
                rating: driver.rating,
                totalDeliveries: driver.totalDeliveries,
                earnings: driver.earnings,
                payRate: driver.payRate,
                vehicle: driver.vehicle,
            },
        });
    } catch (error) {
        console.error('Get driver profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update driver profile
// @route   PUT /api/driver-auth/profile
// @access  Private (Driver)
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, vehicle } = req.body;

        const driver = await Driver.findById(req.driver.id);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update allowed fields
        if (firstName) driver.firstName = firstName;
        if (lastName) driver.lastName = lastName;
        if (email) driver.email = email;
        if (vehicle) {
            driver.vehicle = { ...driver.vehicle, ...vehicle };
        }

        await driver.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            driver: {
                id: driver._id,
                firstName: driver.firstName,
                lastName: driver.lastName,
                phone: driver.phone,
                email: driver.email,
                vehicle: driver.vehicle,
            },
        });
    } catch (error) {
        console.error('Update driver profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change driver password
// @route   PUT /api/driver-auth/password
// @access  Private (Driver)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const driver = await Driver.findById(req.driver.id).select('+password');

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Check current password
        const isMatch = await driver.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        driver.password = newPassword;
        await driver.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get assigned deliveries
// @route   GET /api/driver-auth/deliveries
// @access  Private (Driver)
exports.getAssignedDeliveries = async (req, res) => {
    try {
        const driverId = req.driver.id;

        // Get orders assigned to this driver that are not delivered or cancelled
        const orders = await Order.find({
            'delivery.driverId': driverId,
            status: { $in: ['confirmed', 'shopping', 'delivering', 'picked-up'] },
        })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name emoji imageUrl');

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error('Get assigned deliveries error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get available orders (not assigned to any driver)
// @route   GET /api/driver-auth/available-orders
// @access  Private (Driver)
exports.getAvailableOrders = async (req, res) => {
    try {
        // Get orders that don't have a driver assigned yet and are confirmed
        const orders = await Order.find({
            $or: [{ 'delivery.driverId': { $exists: false } }, { 'delivery.driverId': null }],
            status: { $in: ['confirmed', 'shopping'] },
            'payment.status': 'completed',
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('items.productId', 'name emoji imageUrl');

        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error('Get available orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Claim an available order
// @route   POST /api/driver-auth/orders/:orderId/claim
// @access  Private (Driver)
exports.claimOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const driverId = req.driver.id;

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order is already assigned
        if (order.delivery.driverId) {
            return res.status(400).json({ message: 'Order already assigned to another driver' });
        }

        // Check if order status is appropriate
        if (!['confirmed', 'shopping'].includes(order.status)) {
            return res.status(400).json({ message: 'Order is not available for claiming' });
        }

        // Get driver info
        const driver = await Driver.findById(driverId);

        // Update order using findByIdAndUpdate to avoid full validation
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    'delivery.driverId': driverId,
                    'delivery.driverName': `${driver.firstName} ${driver.lastName}`,
                    status: 'shopping',
                },
            },
            { new: true, runValidators: false }
        ).populate('items.productId', 'name emoji imageUrl');

        // Update driver status to busy
        driver.status = 'busy';
        await driver.save();

        res.json({
            success: true,
            message: 'Order claimed successfully',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Claim order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get delivery history
// @route   GET /api/driver-auth/history
// @access  Private (Driver)
exports.getDeliveryHistory = async (req, res) => {
    try {
        const driverId = req.driver.id;

        // Get completed deliveries
        const orders = await Order.find({
            'delivery.driverId': driverId,
            status: { $in: ['delivered', 'cancelled'] },
        })
            .sort({ 'delivery.actualTime': -1 })
            .limit(50)
            .populate('items.productId', 'name emoji imageUrl');

        // Calculate earnings
        const earnings = orders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => {
                const basePay = 4.0; // Driver pay rate
                const tip = order.pricing?.tip || 0;
                return sum + basePay + tip;
            }, 0);

        res.json({
            success: true,
            count: orders.length,
            totalEarnings: earnings,
            orders,
        });
    } catch (error) {
        console.error('Get delivery history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update order status (mark as picked up or delivered)
// @route   PUT /api/driver-auth/orders/:orderId/status
// @access  Private (Driver)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const driverId = req.driver.id;

        // Validate status
        const validStatuses = ['picked-up', 'delivering', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res
                .status(400)
                .json({ message: 'Invalid status. Must be picked-up, delivering, or delivered.' });
        }

        // Find order and verify it's assigned to this driver
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.delivery.driverId.toString() !== driverId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Build the update object based on status
        const updateData = { status };

        // Update timestamps and driver status based on action
        if (status === 'picked-up') {
            updateData['delivery.pickedUpAt'] = new Date();
            // Driver is now busy with this order
            await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
        } else if (status === 'delivering') {
            if (!order.delivery.pickedUpAt) {
                updateData['delivery.pickedUpAt'] = new Date();
            }
            // Update driver status to busy
            await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
        } else if (status === 'delivered') {
            updateData['delivery.actualTime'] = new Date();

            // Update driver's total deliveries and earnings
            const driver = await Driver.findById(driverId);
            driver.totalDeliveries += 1;
            driver.earnings += driver.payRate + (order.pricing?.tip || 0);
            driver.status = 'online'; // Set back to online after delivery
            await driver.save();
        }

        // Use findByIdAndUpdate to avoid validation errors on legacy orders
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true, runValidators: false }
        ).populate('items.productId', 'name emoji imageUrl');

        // Send status update email to customer
        // (You can implement this later with your email service)

        res.json({
            success: true,
            message: `Order marked as ${status}`,
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update driver availability status
// @route   PUT /api/driver-auth/status
// @access  Private (Driver)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['online', 'offline'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be online or offline' });
        }

        const driver = await Driver.findByIdAndUpdate(req.driver.id, { status }, { new: true });

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            status: driver.status,
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload delivery proof photo
// @route   POST /api/driver-auth/orders/:orderId/proof
// @access  Private (Driver)
exports.uploadDeliveryProof = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { photoUrl } = req.body;
        const driverId = req.driver.id;

        // Find order and verify it's assigned to this driver
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.delivery.driverId.toString() !== driverId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Update delivery proof using findByIdAndUpdate
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    'delivery.proofPhoto': {
                        url: photoUrl,
                        uploadedAt: new Date(),
                    },
                },
            },
            { new: true, runValidators: false }
        );

        res.json({
            success: true,
            message: 'Delivery proof uploaded successfully',
            proofPhoto: updatedOrder.delivery.proofPhoto,
        });
    } catch (error) {
        console.error('Upload proof error:', error);
        res.status(500).json({ message: 'Server error uploading proof' });
    }
};
