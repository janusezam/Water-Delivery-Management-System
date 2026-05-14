const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Delivering', 'Completed', 'Cancelled', 'delivered', 'dispatched', 'Dispatched', 'Failed Attempt'],
        default: 'Pending'
    },
    deliveryProofUrl: {
        type: String
    },
    failedReason: {
        type: String
    },
    failedNote: {
        type: String
    },
    cancelReason: {
        type: String
    },
    cancelMessage: {
        type: String
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        qty: Number,
        price: Number,
        payDeposit: {
            type: Boolean,
            default: false
        },
        depositAmount: {
            type: Number,
            default: 0
        }
    }],
    totalAmount: {
        type: Number,
        default: 0
    },
    jugsReturned: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
