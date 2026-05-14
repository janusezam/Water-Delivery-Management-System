const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../models/Order');
const WalkInSale = require('../models/WalkInSale');
const Product = require('../models/Product');

const cleanupTubigs = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully.\n');

        // 1. Rename the "tubigs" product name in existing Orders
        console.log('Checking Orders for "tubigs"...');
        const ordersResult = await Order.updateMany(
            { 'items.productName': /tubig/i },
            { $set: { 'items.$[elem].productName': 'Legacy Product' } },
            { arrayFilters: [{ 'elem.productName': /tubig/i }] }
        );
        console.log(`Updated ${ordersResult.modifiedCount} orders.\n`);

        // 2. Check for Products named "tubigs" and rename them
        console.log('Checking Products for "tubigs"...');
        const productsResult = await Product.updateMany(
            { name: /tubig/i },
            { $set: { name: 'Legacy Product (Deleted)', isActive: false } }
        );
        console.log(`Updated ${productsResult.modifiedCount} products.\n`);

        // Note: WalkInSale doesn't store productName, it populates from Product.
        // By renaming the Product document above, the WalkInSale report will 
        // automatically show the new name.

        console.log('Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup Error:', error);
        process.exit(1);
    }
};

cleanupTubigs();
