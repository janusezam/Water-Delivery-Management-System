const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
require('dotenv').config();

async function repair() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Target product: Tubigs
        const tubigs = await Product.findOne({ name: 'Tubigs' });
        if (!tubigs) {
            console.log('Tubigs product not found');
            process.exit(1);
        }

        const initialStock = tubigs.stockQty;
        console.log(`Initial Stock for Tubigs: ${initialStock}`);

        // Missed orders (the 3 we saw in inspect)
        const missedQty = 1 + 5 + 2; // From the 3 orders we inspected
        
        console.log(`Deducting ${missedQty} units for existing completed orders...`);
        
        tubigs.stockQty -= missedQty;
        await tubigs.save();

        // Also fix the orders to link the product ID so future logic works if status changes
        const orders = await Order.find({ status: { $in: ['delivered', 'Completed'] } });
        for (const order of orders) {
            let changed = false;
            if (Array.isArray(order.items)) {
                for (const item of order.items) {
                    if (!item.product) {
                        item.product = tubigs._id;
                        changed = true;
                    }
                }
            }
            if (changed) {
                await Order.findByIdAndUpdate(order._id, { items: order.items });
            }
        }

        console.log(`Successfully synced! New Stock: ${tubigs.stockQty}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
repair();
