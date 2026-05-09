const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    street: { type: String, required: true },
    barangay: { type: String, required: true },
    city: { type: String, default: 'Seaside City' },
    isDefault: { type: Boolean, default: false }
});

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    addresses: [addressSchema],
    jugBalance: {
        type: Number,
        default: 0 // Positive means customer owes jugs, Negative means station owes jugs
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
