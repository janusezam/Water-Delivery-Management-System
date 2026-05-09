const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    startKm: {
        type: Number
    },
    endKm: {
        type: Number
    },
    kmTraveled: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'ongoing', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
