const Order = require('../models/Order');
const WalkInSale = require('../models/WalkInSale');
const GasExpense = require('../models/GasExpense');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// @desc    Get comprehensive business report
// @route   GET /api/reports/summary
const getSummaryReport = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 1. Revenue Stats (Delivery + Walk-in)
        const deliveryRevenue = await Order.aggregate([
            { $match: { status: 'delivered', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const walkInRevenue = await WalkInSale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // 2. Expense Stats
        const gasExpenses = await GasExpense.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);

        // 3. Jug Accountability
        const jugStats = await Customer.aggregate([
            { $group: { _id: null, totalOwed: { $sum: '$jugBalance' } } }
        ]);

        // 4. Other Dashboard Stats
        const totalOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
        const activeDrivers = await Driver.countDocuments({ status: 'available' });
        const lowStockProducts = 0; // Placeholder until stock tracking is fully implemented

        res.json({
            revenue: {
                delivery: deliveryRevenue[0]?.total || 0,
                walkIn: walkInRevenue[0]?.total || 0,
                total: (deliveryRevenue[0]?.total || 0) + (walkInRevenue[0]?.total || 0)
            },
            expenses: {
                gas: gasExpenses[0]?.total || 0
            },
            jugs: {
                outstanding: jugStats[0]?.totalOwed || 0
            },
            totalOrders,
            activeDrivers,
            lowStockProducts
        });
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

module.exports = {
    getSummaryReport
};
