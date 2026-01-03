const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        // Business Information
        businessName: {
            type: String,
            default: 'Hometown Grocery Delivery',
        },
        shortName: {
            type: String,
            default: 'Hometown Delivery',
        },

        // Location
        townName: {
            type: String,
            default: 'Your Town',
        },
        state: {
            type: String,
            default: 'State',
        },
        zipCode: {
            type: String,
            default: '12345',
        },
        fullAddress: {
            type: String,
            default: '123 Main Street, Your Town, State 12345',
        },

        // Contact Information
        phone: {
            type: String,
            default: '555-123-4567',
        },
        phoneDisplay: {
            type: String,
            default: '555-123-4567',
        },
        email: {
            type: String,
            default: 'info@hometowndelivery.com',
        },

        // Store Information
        storeName: {
            type: String,
            default: 'Local Market',
        },
        storePartner: {
            type: String,
            default: 'Your Local Grocery Store',
        },

        // Business Hours
        hours: {
            weekday: {
                display: {
                    type: String,
                    default: 'Mon-Fri 8am-6pm',
                },
                detailed: {
                    type: String,
                    default: 'Monday - Friday: 8am - 6pm',
                },
            },
            saturday: {
                display: {
                    type: String,
                    default: 'Sat 9am-3pm',
                },
                detailed: {
                    type: String,
                    default: 'Saturday: 9am - 3pm',
                },
            },
            sunday: {
                display: {
                    type: String,
                    default: 'Closed',
                },
                detailed: {
                    type: String,
                    default: 'Sunday: Closed',
                },
            },
            full: {
                type: String,
                default: 'Mon-Fri 8am-6pm, Sat 9am-3pm',
            },
        },

        // Service Details
        deliveryFee: {
            type: Number,
            default: 5.0,
        },
        minimumOrder: {
            type: Number,
            default: 20.0,
        },
        averageDeliveryTime: {
            type: String,
            default: '2 hours',
        },
        deliveryRadius: {
            type: String,
            default: '10 miles',
        },

        // Social Media
        social: {
            facebook: {
                type: String,
                default: '',
            },
            instagram: {
                type: String,
                default: '',
            },
            twitter: {
                type: String,
                default: '',
            },
        },

        // Features
        features: {
            type: [String],
            default: ['Same Day Delivery', 'Cash Accepted', 'Local Drivers', 'Senior Friendly'],
        },

        // Singleton pattern - only one settings document
        singleton: {
            type: Boolean,
            default: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

// Static method to get settings (creates if doesn't exist)
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ singleton: true });

    if (!settings) {
        // Create default settings if none exist
        settings = await this.create({ singleton: true });
    }

    return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function (updates) {
    let settings = await this.findOne({ singleton: true });

    if (!settings) {
        settings = await this.create({ singleton: true, ...updates });
    } else {
        Object.assign(settings, updates);
        await settings.save();
    }

    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
