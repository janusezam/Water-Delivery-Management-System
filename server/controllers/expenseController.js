const GasExpense = require('../models/GasExpense');
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// @desc    Log a gas expense
// @route   POST /api/expenses
const logExpense = async (req, res) => {
    const { driver, trip, pricePerLiter, notes, liters, fuel_station, date, odometer } = req.body;
    try {
        const totalCost = parseFloat((parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2));

        // Handle Cloudinary receipt upload via multer
        const receiptPhoto = req.file ? req.file.path : null;

        const expense = await GasExpense.create({
            driver,
            trip: trip || undefined,
            date: date || Date.now(),
            liters: parseFloat(liters),
            pricePerLiter: parseFloat(pricePerLiter),
            totalCost,
            receiptPhoto,
            notes,
            odometer: odometer ? parseFloat(odometer) : undefined,
            fuel_station,
            createdBy: req.user._id,
            is_reviewed: req.user.role === 'admin' ? true : false // Auto-review if admin creates
        });

        // Populate driver info before returning
        const populated = await GasExpense.findById(expense._id)
            .populate({ path: 'driver', populate: { path: 'user', select: 'name' } })
            .populate('createdBy', 'name role')
            .populate('trip');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error logging expense. Message:', error.message);
        console.error(error.stack);
        if (error.errors) {
            console.error('Validation Errors:', error.errors);
        }
        res.status(400).json({ message: 'Error logging expense', error: error.message, stack: error.stack });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
    try {
        const { from, to } = req.query;
        let filter = {};

        // Date range filter
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        const expenses = await GasExpense.find(filter)
            .populate({
                path: 'driver',
                populate: { path: 'user', select: 'name' }
            })
            .populate('createdBy', 'name role')
            .populate('trip')
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

// @desc    Update a gas expense
// @route   PATCH /api/expenses/:id
const updateExpense = async (req, res) => {
    try {
        const expense = await GasExpense.findById(req.params.id).populate({
            path: 'driver',
            populate: { path: 'user', select: 'name _id' }
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Role-based access: admin can edit any, driver can only edit own unreviewed
        const isAdmin = req.user.role === 'admin';
        const isOwner = expense.driver?.user?._id?.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to edit this expense' });
        }

        if (!isAdmin && expense.is_reviewed) {
            return res.status(403).json({ message: 'Cannot edit a reviewed expense' });
        }

        // Update fields
        const { pricePerLiter, notes, odometer, liters, fuel_station, trip, is_reviewed, date } = req.body;

        if (pricePerLiter !== undefined) expense.pricePerLiter = parseFloat(pricePerLiter);
        if (notes !== undefined) expense.notes = notes;
        if (fuel_station !== undefined) expense.fuel_station = fuel_station;
        if (trip !== undefined) expense.trip = trip || undefined;
        if (date !== undefined) expense.date = date;
        if (odometer !== undefined) expense.odometer = parseFloat(odometer);
        if (liters !== undefined) expense.liters = parseFloat(liters);

        // Admin can toggle reviewed status
        if (isAdmin && is_reviewed !== undefined) {
            expense.is_reviewed = is_reviewed;
        }

        // Recompute derived fields
        if (expense.liters && expense.pricePerLiter) {
            expense.totalCost = parseFloat((expense.liters * expense.pricePerLiter).toFixed(2));
        }

        // Handle receipt photo upload
        if (req.file) {
            expense.receiptPhoto = req.file.path;
        }

        await expense.save();

        // Re-populate for response
        const updated = await GasExpense.findById(expense._id)
            .populate({ path: 'driver', populate: { path: 'user', select: 'name' } })
            .populate('createdBy', 'name role')
            .populate('trip');

        res.json(updated);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(400).json({ message: 'Error updating expense', error: error.message });
    }
};

// @desc    Delete a gas expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
    try {
        const expense = await GasExpense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await GasExpense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};

// @desc    Get expense summary stats
// @route   GET /api/expenses/summary
const getExpenseSummary = async (req, res) => {
    try {
        const { period, from, to } = req.query;
        let dateFilter = {};

        // Determine date range based on period or custom dates
        const now = new Date();
        if (period === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { date: { $gte: weekAgo, $lte: now } };
        } else if (period === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateFilter = { date: { $gte: monthAgo, $lte: now } };
        } else if (from || to) {
            dateFilter.date = {};
            if (from) dateFilter.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.date.$lte = toDate;
            }
        }

        const expenses = await GasExpense.find(dateFilter).populate({ path: 'driver', populate: { path: 'user' } });

        const total_spend = expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        const total_liters = expenses.reduce((sum, e) => sum + (e.liters || 0), 0);
        const number_of_fillups = expenses.length;

        const avg_price_per_liter = number_of_fillups > 0
            ? parseFloat((expenses.reduce((sum, e) => sum + (e.pricePerLiter || 0), 0) / number_of_fillups).toFixed(2))
            : null;

        // Compute fuel_cost_per_gallon_delivered
        let fuel_cost_per_gallon_delivered = null;
        try {
            // Query completed orders in the same date period
            const orderFilter = { status: 'Completed' };
            if (dateFilter.date) {
                orderFilter.createdAt = dateFilter.date;
            }

            const orders = await Order.find(orderFilter).populate('items.product');

            let total_gallons_delivered = 0;
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.product && item.product.type === 'gallon') {
                        total_gallons_delivered += item.qty || 0;
                    }
                });
            });

            if (total_gallons_delivered > 0 && total_spend > 0) {
                fuel_cost_per_gallon_delivered = parseFloat((total_spend / total_gallons_delivered).toFixed(2));
            }
        } catch (err) {
            console.error('Error computing fuel cost per gallon:', err);
        }

        // Compute driver analytics
        const driver_analytics = {};
        expenses.forEach(e => {
            const driverId = e.driver?._id?.toString() || 'Unknown';
            if (!driver_analytics[driverId]) {
                driver_analytics[driverId] = {
                    name: e.driver?.user?.name || 'Unknown',
                    total_spend: 0,
                    total_liters: 0,
                    fillups: 0
                };
            }
            driver_analytics[driverId].total_spend += (e.totalCost || 0);
            driver_analytics[driverId].total_liters += (e.liters || 0);
            driver_analytics[driverId].fillups += 1;
        });

        // Format to array
        const driver_analytics_array = Object.values(driver_analytics)
            .sort((a, b) => b.total_spend - a.total_spend);

        res.json({
            total_spend: parseFloat(total_spend.toFixed(2)),
            total_liters: parseFloat(total_liters.toFixed(2)),
            avg_price_per_liter,
            number_of_fillups,
            fuel_cost_per_gallon_delivered,
            driver_analytics: driver_analytics_array
        });
    } catch (error) {
        console.error('Error fetching expense summary:', error);
        res.status(500).json({ message: 'Error fetching expense summary' });
    }
};

// @desc    Export expenses as CSV
// @route   GET /api/expenses/export
const exportExpenses = async (req, res) => {
    try {
        const { from, to } = req.query;
        let filter = {};

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        const expenses = await GasExpense.find(filter)
            .populate({ path: 'driver', populate: { path: 'user', select: 'name' } })
            .populate('createdBy', 'name role')
            .sort({ date: -1 });

        // Build CSV
        const headers = ['Date', 'Driver', 'Distance (KM)', 'Efficiency (KM/L)', 'Liters', 'Price/L', 'Total Cost', 'Fuel Station', 'Notes', 'Reviewed'];
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.driver?.user?.name || 'Unknown',
            e.km_driven || '',
            e.km_per_liter || '',
            e.liters || '',
            e.pricePerLiter || '',
            e.totalCost || '',
            e.fuel_station || '',
            (e.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
            e.is_reviewed ? 'Yes' : 'No'
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=gas_expenses.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting expenses:', error);
        res.status(500).json({ message: 'Error exporting expenses' });
    }
};

module.exports = {
    logExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    exportExpenses
};
