const express = require('express');
const router = express.Router();
const { processSale, getSales, getTodaySummary } = require('../controllers/walkInController');

router.route('/')
    .get(getSales)
    .post(processSale);

router.get('/today', getTodaySummary);

module.exports = router;
