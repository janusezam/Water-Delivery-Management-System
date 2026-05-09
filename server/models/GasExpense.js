const mongoose = require('mongoose');

const gasExpenseSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    date: {
        type: Date,
        default: Date.now
    },
    liters: {
        type: Number,
        required: true
    },
    pricePerLiter: {
        type: Number,
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    },
    receiptPhoto: {
        type: String // Cloudinary URL
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const GasExpense = mongoose.model('GasExpense', gasExpenseSchema);

module.exports = GasExpense;
