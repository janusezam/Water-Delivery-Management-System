const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Driver = require('./models/Driver');
const Customer = require('./models/Customer');

const sync = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            if (user.role === 'driver') {
                const driverExists = await Driver.findOne({ user: user._id });
                if (!driverExists) {
                    console.log(`Creating Driver profile for: ${user.name} (${user.email})`);
                    await Driver.create({
                        user: user._id,
                        licenseNo: 'PENDING',
                        vehicleType: 'Tricycle', // Default
                        plateNo: 'N/A',
                        status: 'available'
                    });
                }
            }

            if (user.role === 'user') {
                const customerExists = await Customer.findOne({ name: user.name }); // Match by name as fallback
                if (!customerExists) {
                    console.log(`Creating Customer record for: ${user.name} (${user.email})`);
                    await Customer.create({
                        name: user.name,
                        phone: '09xxxxxxxxx', // Placeholder
                        addresses: [{
                            street: 'Unknown',
                            barangay: 'Unknown',
                            city: 'Seaside City'
                        }],
                        notes: 'Automatically created from User account'
                    });
                }
            }
        }
        
        console.log('Sync completed.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

sync();
