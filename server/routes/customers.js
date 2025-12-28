const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');
const { customerValidation, validate } = require('../middleware/validation');

// Protected routes
router.get('/', protect, authorize('admin', 'manager'), customerController.getCustomers);
router.get('/export/csv', protect, authorize('admin', 'manager'), customerController.exportCustomers);
router.get('/by-phone/:phone', customerController.getCustomerByPhone);
router.get('/:id', protect, authorize('admin', 'manager'), customerController.getCustomer);
router.put('/:id', protect, authorize('admin', 'manager'), customerValidation, validate, customerController.updateCustomer);

module.exports = router;
