const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'order_created',
            'order_status',
            'order_assigned',
            'order_cancelled',
            'delivery_completed',
            'delivery_failed',
            'trip_created',
            'trip_assigned',
            'trip_ended',
            'trip_completed',
            'trip_cancelled',
            'low_stock',
            'expense_logged'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedModel: {
        type: String,
        enum: ['Order', 'TripSale', 'Product', 'GasExpense', null],
        default: null
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for efficient queries: user's unread notifications sorted by date
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// TTL index: auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
