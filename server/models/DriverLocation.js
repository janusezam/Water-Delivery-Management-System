const mongoose = require('mongoose');

const driverLocationSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        unique: true
    },
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    heading: {
        type: Number
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);

module.exports = DriverLocation;
