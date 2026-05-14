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
    },
    km_driven: {
        type: Number,
        required: false // Not used anymore
    },
    km_per_liter: {
        type: Number,
        required: false // Not used anymore
    },
    odometer: {
        type: Number // Replaces the old estimator model
    },
    fuel_station: {
        type: String
    },
    is_reviewed: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Pre-save hook to auto-compute liters and totalCost (Legacy hook, left for older edits if necessary)
gasExpenseSchema.pre('save', async function () {
    // If the frontend didn't supply liters directly, compute from legacy fields
    if (!this.liters && this.km_driven && this.km_per_liter) {
        this.liters = parseFloat((this.km_driven / this.km_per_liter).toFixed(2));
    }

    // Always compute totalCost
    if (this.liters && this.pricePerLiter) {
        this.totalCost = parseFloat((this.liters * this.pricePerLiter).toFixed(2));
    }
});

const GasExpense = mongoose.model('GasExpense', gasExpenseSchema);

module.exports = GasExpense;
