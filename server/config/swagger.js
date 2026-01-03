const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Hometown Delivery API',
        version: '1.0.0',
        description: 'Complete API documentation for Hometown Delivery platform - a full-stack grocery delivery management system',
        contact: {
            name: 'API Support',
            url: 'https://github.com/Mrcodin/yourtown-delivery'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server'
        },
        {
            url: 'https://yourtown-delivery-api.onrender.com',
            description: 'Production server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token from login'
            }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    username: { type: 'string', example: 'admin' },
                    email: { type: 'string', example: 'admin@hometown.com' },
                    role: { type: 'string', enum: ['admin', 'manager', 'driver'], example: 'admin' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Customer: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    phone: { type: 'string', example: '555-123-4567' },
                    addresses: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                city: { type: 'string' },
                                state: { type: 'string' },
                                zipCode: { type: 'string' },
                                isDefault: { type: 'boolean' }
                            }
                        }
                    }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string', example: 'Fresh Bananas' },
                    category: { type: 'string', example: 'Produce' },
                    price: { type: 'number', example: 2.99 },
                    unit: { type: 'string', example: 'lb' },
                    imageUrl: { type: 'string' },
                    inStock: { type: 'boolean', example: true },
                    description: { type: 'string' }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    orderNumber: { type: 'string', example: 'ORD-1234567890' },
                    customer: { type: 'object' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                product: { type: 'string' },
                                name: { type: 'string' },
                                price: { type: 'number' },
                                quantity: { type: 'number' }
                            }
                        }
                    },
                    pricing: {
                        type: 'object',
                        properties: {
                            subtotal: { type: 'number' },
                            deliveryFee: { type: 'number' },
                            tax: { type: 'number' },
                            tip: { type: 'number' },
                            discount: { type: 'number' },
                            total: { type: 'number' }
                        }
                    },
                    status: {
                        type: 'string',
                        enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked-up', 'delivering', 'delivered', 'cancelled'],
                        example: 'confirmed'
                    },
                    paymentMethod: { type: 'string', enum: ['cash', 'check', 'card'] },
                    paymentStatus: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] }
                }
            },
            Driver: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string', example: 'Mary Johnson' },
                    phone: { type: 'string', example: '555-1234' },
                    email: { type: 'string' },
                    vehicle: { type: 'string', example: 'Toyota Camry' },
                    licensePlate: { type: 'string', example: 'ABC123' },
                    status: { type: 'string', enum: ['available', 'busy', 'offline'] },
                    currentDeliveries: { type: 'number', example: 2 },
                    rating: { type: 'number', example: 4.8 }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Error message' },
                    error: { type: 'string' }
                }
            }
        },
        responses: {
            UnauthorizedError: {
                description: 'Access token is missing or invalid',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            success: false,
                            message: 'Not authorized, token failed'
                        }
                    }
                }
            },
            NotFoundError: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            success: false,
                            message: 'Resource not found'
                        }
                    }
                }
            }
        }
    },
    tags: [
        { name: 'Authentication', description: 'User authentication endpoints (Admin, Manager, Driver)' },
        { name: 'Customer Auth', description: 'Customer authentication and profile management' },
        { name: 'Products', description: 'Product catalog management' },
        { name: 'Orders', description: 'Order creation and management' },
        { name: 'Customers', description: 'Customer database management' },
        { name: 'Drivers', description: 'Driver management and assignments' },
        { name: 'Payments', description: 'Stripe payment processing' },
        { name: 'Reports', description: 'Analytics and reporting' },
        { name: 'Activity Logs', description: 'System activity tracking' }
    ]
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.js', './controllers/*.js', './server.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
