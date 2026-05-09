const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['slim', 'round', 'gallon'],
        required: true
    },
    pricePerUnit: {
        type: Number,
        required: true,
        default: 0
    },
    stockQty: {
        type: Number,
        required: true,
        default: 0
    },
    containerDeposit: {
        type: Number,
        required: true,
        default: 0
    },
    imageUrl: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
