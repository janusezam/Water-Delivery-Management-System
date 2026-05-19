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
            await mongoose.disconnect();
            process.exit();
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@wrs.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const admin = await User.create({
            name: 'System Admin',
            email: adminEmail,
            password: adminPassword, // This will be hashed by the User model pre-save hook
            role: 'admin',
            isActivated: true
        });

        console.log('Admin account created successfully:');
        console.log(`Email: ${adminEmail}`);
        console.log('Password: [HIDDEN FOR SECURITY - Check your .env file or default]');
        await mongoose.disconnect();
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedAdmin();
