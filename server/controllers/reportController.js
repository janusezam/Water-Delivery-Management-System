const Order = require('../models/Order');
const WalkInSale = require('../models/WalkInSale');
const GasExpense = require('../models/GasExpense');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// @desc    Get comprehensive business report
// @route   GET /api/reports/comprehensive
const getComprehensiveReport = async (req, res) => {
    try {
        const { period, from, to } = req.query;
        let startDate, endDate;
        let prevStartDate, prevEndDate;
        const now = new Date();

        if (period === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - 1);
            prevEndDate = new Date(endDate);
            prevEndDate.setDate(prevEndDate.getDate() - 1);
        } else if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            prevStartDate = new Date(startDate);
            prevStartDate.setDate(prevStartDate.getDate() - 7);
            prevEndDate = new Date(startDate);
            prevEndDate.setDate(prevEndDate.getDate() - 1);
            prevEndDate.setHours(23, 59, 59, 999);
        } else if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            const duration = endDate.getTime() - startDate.getTime();
            prevStartDate = new Date(startDate.getTime() - duration);
            prevEndDate = new Date(startDate.getTime() - 1);
        } else { // default to 'month'
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }

        const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
        const prevDateFilter = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };

        // 1. Revenue
        const [deliveryRev, walkInRev, prevDeliveryRev, prevWalkInRev] = await Promise.all([
            Order.aggregate([{ $match: { ...dateFilter, status: { $in: ['Completed', 'delivered'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            WalkInSale.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            Order.aggregate([{ $match: { ...prevDateFilter, status: { $in: ['Completed', 'delivered'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            WalkInSale.aggregate([{ $match: prevDateFilter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
        ]);

        const currentTotal = (deliveryRev[0]?.total || 0) + (walkInRev[0]?.total || 0);
        const prevTotal = (prevDeliveryRev[0]?.total || 0) + (prevWalkInRev[0]?.total || 0);
        const revenueGrowth = prevTotal === 0 ? (currentTotal > 0 ? 100 : 0) : ((currentTotal - prevTotal) / prevTotal) * 100;

        // Daily Revenue for Chart
        const dailyOrders = await Order.aggregate([
            { $match: { ...dateFilter, status: { $in: ['Completed', 'delivered'] } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, delivery: { $sum: '$totalAmount' } } }
        ]);
        const dailyWalkIns = await WalkInSale.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, walkIn: { $sum: '$totalAmount' } } }
        ]);

        const dailyRevenueMap = {};
        dailyOrders.forEach(d => { dailyRevenueMap[d._id] = { date: d._id, delivery: d.delivery, walkIn: 0 }; });
        dailyWalkIns.forEach(d => {
            if (!dailyRevenueMap[d._id]) dailyRevenueMap[d._id] = { date: d._id, delivery: 0, walkIn: 0 };
            dailyRevenueMap[d._id].walkIn = d.walkIn;
        });
        const dailyRevenue = Object.values(dailyRevenueMap).sort((a, b) => a.date.localeCompare(b.date));

        // 2. Expenses
        const [gasExp, prevGasExp] = await Promise.all([
            GasExpense.aggregate([{ $match: { date: { $gte: startDate, $lte: endDate } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
            GasExpense.aggregate([{ $match: { date: { $gte: prevStartDate, $lte: prevEndDate } } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }])
        ]);

        const currentGas = gasExp[0]?.total || 0;
        const prevGas = prevGasExp[0]?.total || 0;
        const expenseGrowth = prevGas === 0 ? (currentGas > 0 ? 100 : 0) : ((currentGas - prevGas) / prevGas) * 100;

        // 3. Jugs
        const jugStats = await Customer.aggregate([{ $group: { _id: null, totalOwed: { $sum: '$jugBalance' } } }]);

        // 4. Orders
        const ordersByStatus = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        let totalOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let failedOrders = 0;
        const statusMap = {};

        ordersByStatus.forEach(s => {
            statusMap[s._id] = s.count;
            totalOrders += s.count;
            if (['Completed', 'delivered'].includes(s._id)) completedOrders += s.count;
            if (s._id === 'Cancelled') cancelledOrders += s.count;
            if (s._id === 'Failed Attempt') failedOrders += s.count;
        });

        const fulfillmentRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

        const allOrdersInPeriod = await Order.find(dateFilter);
        const totalItemsCount = allOrdersInPeriod.reduce((sum, order) => sum + (order.items?.length || 0), 0);
        const avgItemsPerOrder = totalOrders > 0 ? (totalItemsCount / totalOrders).toFixed(1) : 0;

        // 5. Products (Top by Qty & Revenue)
        const productsData = {};
        allOrdersInPeriod.filter(o => ['Completed', 'delivered'].includes(o.status)).forEach(order => {
            order.items?.forEach(item => {
                if (!item.product) return;
                const id = item.product.toString();
                if (!productsData[id]) productsData[id] = { name: item.productName || 'Unknown', qty: 0, revenue: 0 };
                productsData[id].qty += item.qty;
                productsData[id].revenue += item.qty * item.price;
            });
        });

        const allWalkInsInPeriod = await WalkInSale.find(dateFilter).populate('items.product');
        allWalkInsInPeriod.forEach(sale => {
            sale.items?.forEach(item => {
                if (!item.product) return;
                const id = item.product._id.toString();
                if (!productsData[id]) productsData[id] = { name: item.product.name, qty: 0, revenue: 0 };
                productsData[id].qty += item.qty;
                productsData[id].revenue += item.qty * item.price;
            });
        });

        const productsArray = Object.values(productsData);
        const topByQuantity = [...productsArray].sort((a, b) => b.qty - a.qty).slice(0, 5);
        const topByRevenue = [...productsArray].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // 6. Drivers
        const activeDrivers = await Driver.countDocuments({ status: 'available' });
        const totalDrivers = await Driver.countDocuments();
        
        const driverPerformanceMap = {};
        allOrdersInPeriod.filter(o => ['Completed', 'delivered'].includes(o.status) && o.assignedDriver).forEach(order => {
            const driverId = order.assignedDriver.toString();
            if (!driverPerformanceMap[driverId]) driverPerformanceMap[driverId] = { deliveries: 0, fuelSpend: 0, fuelLiters: 0 };
            driverPerformanceMap[driverId].deliveries += 1;
        });

        const allGasInPeriod = await GasExpense.find({ date: { $gte: startDate, $lte: endDate } }).populate('driver');
        allGasInPeriod.forEach(exp => {
            if (!exp.driver) return;
            const driverUserId = exp.driver.user.toString();
            if (!driverPerformanceMap[driverUserId]) driverPerformanceMap[driverUserId] = { deliveries: 0, fuelSpend: 0, fuelLiters: 0 };
            driverPerformanceMap[driverUserId].fuelSpend += exp.totalCost;
            driverPerformanceMap[driverUserId].fuelLiters += exp.liters;
        });

        const performanceArray = [];
        for (const [userId, stats] of Object.entries(driverPerformanceMap)) {
            const driverDoc = await Driver.findOne({ user: userId }).populate('user', 'name');
            if (driverDoc && driverDoc.user) {
                performanceArray.push({
                    name: driverDoc.user.name,
                    ...stats
                });
            }
        }
        performanceArray.sort((a, b) => b.deliveries - a.deliveries);

        // 7. Recent Activity
        const recentOrders = await Order.find({ status: { $in: ['Completed', 'delivered'] } })
            .sort({ updatedAt: -1 }).limit(10).populate('user', 'name');
        const recentWalkIns = await WalkInSale.find()
            .sort({ createdAt: -1 }).limit(10);
        const recentExpenses = await GasExpense.find()
            .sort({ createdAt: -1 }).limit(10).populate({ path: 'driver', populate: { path: 'user', select: 'name' } });

        const activity = [
            ...recentOrders.map(o => ({ type: 'order', description: `Order for ${o.customerName || 'Unknown'} delivered`, time: o.updatedAt })),
            ...recentWalkIns.map(w => ({ type: 'walkin', description: `Walk-in sale ₱${w.totalAmount}`, time: w.createdAt })),
            ...recentExpenses.map(e => ({ type: 'expense', description: `Gas logged for ${e.driver?.user?.name || 'Unknown'} (₱${e.totalCost})`, time: e.createdAt }))
        ].sort((a, b) => b.time - a.time).slice(0, 15);

        res.json({
            dateRange: { from: startDate, to: endDate },
            revenue: {
                delivery: deliveryRev[0]?.total || 0,
                walkIn: walkInRev[0]?.total || 0,
                total: currentTotal,
                previousTotal: prevTotal,
                growthPercent: revenueGrowth,
                daily: dailyRevenue
            },
            expenses: {
                gas: currentGas,
                previousGas: prevGas,
                growthPercent: expenseGrowth
            },
            jugs: {
                outstanding: jugStats[0]?.totalOwed || 0
            },
            orders: {
                total: totalOrders,
                byStatus: statusMap,
                fulfillmentRate,
                cancelledCount: cancelledOrders,
                failedCount: failedOrders,
                avgItemsPerOrder
            },
            products: {
                topByQuantity,
                topByRevenue
            },
            drivers: {
                total: totalDrivers,
                available: activeDrivers,
                performance: performanceArray
            },
            recentActivity: activity
        });
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ message: 'Error generating comprehensive report' });
    }
};

// Keep old summary for backward compatibility if needed by AdminDashboard
const getSummaryReport = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const deliveryRevenue = await Order.aggregate([
            { $match: { status: { $in: ['Completed', 'delivered'] }, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const walkInRevenue = await WalkInSale.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const gasExpenses = await GasExpense.aggregate([
            { $match: { date: { $gte: startOfMonth } } }, // Changed createdAt to date
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);

        const jugStats = await Customer.aggregate([
            { $group: { _id: null, totalOwed: { $sum: '$jugBalance' } } }
        ]);

        const totalOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
        const activeDrivers = await Driver.countDocuments({ status: 'available' });

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
            lowStockProducts: 0
        });
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

module.exports = {
    getSummaryReport,
    getComprehensiveReport
};
