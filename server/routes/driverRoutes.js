const express = require('express');
const router = express.Router();
const { getDrivers, createDriver, updateDriverStatus, updateDriver } = require('../controllers/driverController');

router.route('/')
    .get(getDrivers)
    .post(createDriver);

router.route('/:id')
    .put(updateDriver);

router.put('/:id/status', updateDriverStatus);

module.exports = router;
