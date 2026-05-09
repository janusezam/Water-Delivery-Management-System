const express = require('express');
const router = express.Router();
const { getSummaryReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/summary', protect, authorize('admin', 'staff'), getSummaryReport);

module.exports = router;
