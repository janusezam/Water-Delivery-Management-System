const express = require('express');
const router = express.Router();
const { getDrivers, createDriver, updateDriverStatus, updateDriver } = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'staff'), getDrivers)
    .post(protect, authorize('admin'), createDriver);

router.route('/:id')
    .put(protect, authorize('admin'), updateDriver);

router.put('/:id/status', protect, authorize('admin', 'driver'), updateDriverStatus);

module.exports = router;
