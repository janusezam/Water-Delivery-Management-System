const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit();
        }

        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@wrs.com',
            password: 'admin123', // This will be hashed by the User model pre-save hook
            role: 'admin'
        });

        console.log('Admin account created successfully:');
        console.log('Email: admin@wrs.com');
        console.log('Password: admin123');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
