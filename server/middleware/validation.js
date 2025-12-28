const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Login validation
exports.loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Product validation
exports.productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .isIn(['bakery', 'dairy', 'produce', 'meat', 'pantry', 'frozen', 'beverages'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['active', 'out-of-stock', 'hidden'])
    .withMessage('Invalid status')
];

// Order validation
exports.orderValidation = [
  body('customerInfo.name').trim().notEmpty().withMessage('Customer name is required'),
  body('customerInfo.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('customerInfo.address').trim().notEmpty().withMessage('Address is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('payment.method')
    .isIn(['cash', 'check', 'card'])
    .withMessage('Invalid payment method')
];

// Customer validation
exports.customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

// Driver validation
exports.driverValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('vehicle.type')
    .optional()
    .isIn(['car', 'suv', 'truck', 'van'])
    .withMessage('Invalid vehicle type')
];
