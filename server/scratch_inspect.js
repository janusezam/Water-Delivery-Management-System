const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');
const Driver = require('./models/Driver');
const User = require('./models/User');
const Product = require('./models/Product');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const customers = await Customer.find({});
        const drivers = await Driver.find({});
        const users = await User.find({});
        const products = await Product.find({});
        
        console.log('--- Database Inspection ---');
        console.log(`Customers Count: ${customers.length}`);
        console.log(`Drivers Count: ${drivers.length}`);
        console.log(`Users Count: ${users.length}`);
        console.log(`Products Count: ${products.length}`);

        console.log('User Roles:', users.map(u => ({ email: u.email, role: u.role })));

        
        if (customers.length > 0) {
            console.log('Sample Customer:', customers[0]);
        }
        
        if (drivers.length > 0) {
            console.log('Sample Driver:', drivers[0]);
        }
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspect();
