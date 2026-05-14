const express = require('express');
const router = express.Router();
const { getSummaryReport, getComprehensiveReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/summary', protect, authorize('admin', 'staff'), getSummaryReport);
router.get('/comprehensive', protect, authorize('admin', 'staff'), getComprehensiveReport);

module.exports = router;
