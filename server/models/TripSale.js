const mongoose = require('mongoose');

const TripSaleSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loadedItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        qtyLoaded: {
            type: Number,
            required: true
        },
        pricePerUnit: {
            type: Number,
            required: true
        },
        qtyReturned: {
            type: Number,
            default: 0
        }
    }],
    sales: [{
        customerName: {
            type: String,
            default: 'Walk-up Customer'
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        items: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            qty: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }],
        jugsCollected: {
            type: Number,
            default: 0
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'order'],
            default: 'cash'
        },
        totalAmount: {
            type: Number,
            required: true
        },
        soldAt: {
            type: Date,
            default: Date.now
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    }],
    status: {
        type: String,
        enum: ['loading', 'active', 'pending_review', 'completed', 'cancelled'],
        default: 'loading'
    },
    tripDate: {
        type: Date,
        default: Date.now
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    notes: {
        type: String
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    totalJugsSold: {
        type: Number,
        default: 0
    },
    totalJugsReturned: {
        type: Number,
        default: 0
    },
    receiptNo: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Auto-generate receipt number before saving
TripSaleSchema.pre('save', async function () {
    if (!this.receiptNo) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const count = await this.constructor.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });
        const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, '');
        const sequence = (count + 1).toString().padStart(4, '0');
        this.receiptNo = `TR-${dateStr}-${sequence}`;
    }
});

TripSaleSchema.index({ driver: 1, status: 1 });
TripSaleSchema.index({ createdAt: -1 });

const TripSale = mongoose.model('TripSale', TripSaleSchema);

module.exports = TripSale;
