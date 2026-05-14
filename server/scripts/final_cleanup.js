const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../models/Order');
const WalkInSale = require('../models/WalkInSale');

const deleteTestData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database.');

        // 1. Delete Orders with "Legacy Product" (previously "tubigs")
        const orderDel = await Order.deleteMany({ 'items.productName': 'Legacy Product' });
        console.log(`Deleted ${orderDel.deletedCount} test orders.`);

        // 2. Delete Walk-In Sales if they contain "tubigs" (unlikely but good to check)
        // Note: WalkInSale uses product ID. If we don't have the ID, we'd need to find the product first.
        // Since we already checked and found 0 products with "tubig" in the name, we focus on Orders.
        
        console.log('Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

deleteTestData();
