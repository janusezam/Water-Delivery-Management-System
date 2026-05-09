const mongoose = require('mongoose');

const walkInSaleSchema = new mongoose.Schema({
    servedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customerName: {
        type: String // For unregistered walk-ins
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
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
    jugsReturned: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'gcash', 'maya'],
        default: 'cash'
    },
    amountTendered: {
        type: Number
    },
    change: {
        type: Number
    },
    receiptNo: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Auto-generate receipt number before saving
walkInSaleSchema.pre('save', async function () {
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
        this.receiptNo = `WI-${dateStr}-${sequence}`;
    }
});

const WalkInSale = mongoose.model('WalkInSale', walkInSaleSchema);

module.exports = WalkInSale;
