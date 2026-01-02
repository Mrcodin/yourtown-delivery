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
            phone,                                    // As provided
            cleanPhone,                               // Digits only
        ];
        
        // Add formatted versions based on length
        if (cleanPhone.length === 7) {
            phoneFormats.push(`${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3)}`); // xxx-xxxx
        } else if (cleanPhone.length === 10) {
            // Full 10-digit formats
            phoneFormats.push(`${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`); // xxx-xxx-xxxx
            phoneFormats.push(`(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`); // (xxx) xxx-xxxx
            
            // Also try first 7 digits (for local numbers stored as 7 digits)
            const first7 = cleanPhone.slice(0, 7);
            phoneFormats.push(first7); // xxxxxxx
            phoneFormats.push(`${first7.slice(0, 3)}-${first7.slice(3)}`); // xxx-xxxx
        }

        // Find driver by phone and include password
        const driver = await Driver.findOne({ 
            phone: { $in: phoneFormats }
        }).select('+password');

        if (!driver) {
            return res.status(401).json({ message: 'Invalid phone or password' });
        }

        // Check if driver is inactive
        if (driver.status === 'inactive') {
            return res.status(401).json({ message: 'Your account is inactive. Please contact admin.' });
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
                payRate: driver.payRate
            }
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
            message: 'Logged out successfully'
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
                vehicle: driver.vehicle
            }
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
                vehicle: driver.vehicle
            }
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
            message: 'Password changed successfully'
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
            status: { $in: ['confirmed', 'shopping', 'delivering'] }
        })
        .sort({ createdAt: -1 })
        .populate('items.productId', 'name emoji imageUrl');

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Get assigned deliveries error:', error);
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
            status: { $in: ['delivered', 'cancelled'] }
        })
        .sort({ 'delivery.actualTime': -1 })
        .limit(50)
        .populate('items.productId', 'name emoji imageUrl');

        // Calculate earnings
        const earnings = orders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => {
                const basePay = 4.00; // Driver pay rate
                const tip = order.pricing?.tip || 0;
                return sum + basePay + tip;
            }, 0);

        res.json({
            success: true,
            count: orders.length,
            totalEarnings: earnings,
            orders
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
        const validStatuses = ['delivering', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find order and verify it's assigned to this driver
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.delivery.driverId.toString() !== driverId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Update order status
        order.status = status;

        // If delivered, update delivery time and driver stats
        if (status === 'delivered') {
            order.delivery.actualTime = new Date();
            
            // Update driver's total deliveries and earnings
            const driver = await Driver.findById(driverId);
            driver.totalDeliveries += 1;
            driver.earnings += driver.payRate + (order.pricing?.tip || 0);
            driver.status = 'online'; // Set back to online after delivery
            await driver.save();
        } else if (status === 'delivering') {
            // Update driver status to busy
            await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
        }

        await order.save();

        // Send status update email to customer
        // (You can implement this later with your email service)

        res.json({
            success: true,
            message: `Order marked as ${status}`,
            order
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

        const driver = await Driver.findByIdAndUpdate(
            req.driver.id,
            { status },
            { new: true }
        );

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            status: driver.status
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
