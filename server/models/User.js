const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false // Now populated from firstName and lastName
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobileNumber: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'staff', 'driver', 'admin'],
        default: 'user'
    },
    isActivated: {
        type: Boolean,
        default: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    activationOTP: String,
    activationOTPExpires: Date,
    resetPasswordOTP: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook for password hashing and name population
userSchema.pre('save', async function () {
    try {
        // Populate full name
        if (this.firstName && this.lastName) {
            this.name = `${this.firstName} ${this.lastName}`;
        }

        if (!this.isModified('password')) {
            return;
        }

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});



const User = mongoose.model('User', userSchema);

module.exports = User;
