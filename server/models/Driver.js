const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    vehicleType: {
        type: String,
        required: true
    },
    plateNo: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'on-trip', 'off'],
        default: 'available'
    }
}, {
    timestamps: true
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
