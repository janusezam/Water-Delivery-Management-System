const mongoose = require('mongoose');
const Order = require('./server/models/Order');
const Product = require('./server/models/Product');
require('dotenv').config({ path: './server/.env' });

async function checkStockSync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wrs_dms');
        console.log('Connected to DB');

        const products = await Product.find({});
        console.log('\n--- Current Products ---');
        products.forEach(p => console.log(`${p.name}: ${p.stockQty} in stock`));

        const completedOrders = await Order.find({ status: { $in: ['delivered', 'Completed'] } });
        console.log(`\nFound ${completedOrders.length} completed orders.`);

        let totalDeductionNeeded = {};
        
        completedOrders.forEach(order => {
            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.product) {
                        const pid = item.product.toString();
                        totalDeductionNeeded[pid] = (totalDeductionNeeded[pid] || 0) + (item.qty || 0);
                    }
                });
            }
        });

        console.log('\n--- Calculated Deductions (from all history) ---');
        for (const [pid, qty] of Object.entries(totalDeductionNeeded)) {
            const product = products.find(p => p._id.toString() === pid);
            console.log(`${product ? product.name : pid}: ${qty} units total in history`);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkStockSync();
