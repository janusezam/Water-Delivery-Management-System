const express = require('express');
const router = express.Router();
const { logExpense, getExpenses } = require('../controllers/expenseController');

router.route('/')
    .get(getExpenses)
    .post(logExpense);

module.exports = router;
