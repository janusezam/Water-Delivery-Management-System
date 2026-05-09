const WalkInSale = require('../models/WalkInSale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Process new walk-in sale
// @route   POST /api/walkin
const processSale = async (req, res) => {
    const { 
        servedBy, 
        customer, 
        customerName, 
        items, 
        jugsReturned, 
        totalAmount, 
        paymentMethod, 
        amountTendered, 
        change 
    } = req.body;

    console.log('Incoming Sale Data:', req.body);
    try {
        // 1. Check stock for all items first
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product || product.stockQty < item.qty) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${product ? product.name : 'Unknown Product'}` 
                });
            }
        }

        // 2. Create the sale record
        const sale = await WalkInSale.create({
            servedBy,
            customer,
            customerName,
            items,
            jugsReturned,
            totalAmount,
            paymentMethod,
            amountTendered,
            change
        });

        // 3. Deduct stock and update customer jug balance
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQty: -item.qty }
            });
        }

        if (customer && jugsReturned > 0) {
            await Customer.findByIdAndUpdate(customer, {
                $inc: { jugBalance: -jugsReturned }
            });
        }

        res.status(201).json(sale);
    } catch (error) {
        console.error('POS Error:', error);
        res.status(500).json({ 
            message: 'Error processing sale',
            error: error.message,
            stack: error.stack
        });
    }
};

// @desc    Get all walk-in sales
// @route   GET /api/walkin
const getSales = async (req, res) => {
    try {
        const sales = await WalkInSale.find({})
            .populate('servedBy', 'name')
            .populate('customer', 'name')
            .sort({ createdAt: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
};

// @desc    Get today's sales summary
// @route   GET /api/walkin/today
const getTodaySummary = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const sales = await WalkInSale.find({
            createdAt: { $gte: start, $lte: end }
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const transactionCount = sales.length;

        res.json({ totalRevenue, transactionCount, sales });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching summary' });
    }
};

module.exports = {
    processSale,
    getSales,
    getTodaySummary
};
