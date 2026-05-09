const GasExpense = require('../models/GasExpense');

// @desc    Log a gas expense
// @route   POST /api/expenses
const logExpense = async (req, res) => {
    const { driver, trip, liters, pricePerLiter, receiptPhoto, notes } = req.body;
    try {
        // Calculate total cost server-side for accuracy
        const totalCost = liters * pricePerLiter;

        const expense = await GasExpense.create({
            driver,
            trip,
            liters,
            pricePerLiter,
            totalCost,
            receiptPhoto,
            notes
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: 'Error logging expense' });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
    try {
        const expenses = await GasExpense.find({})
            .populate({
                path: 'driver',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

module.exports = {
    logExpense,
    getExpenses
};
