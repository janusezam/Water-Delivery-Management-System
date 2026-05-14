const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const Order = require('../models/Order');

const checkOrders = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const orders = await Order.find({ 'items.productName': 'Legacy Product' });
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
};
checkOrders();
