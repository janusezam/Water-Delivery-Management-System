const express = require('express');
const router = express.Router();
const { createTrip, getTrips, completeTrip } = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getTrips)
    .post(protect, authorize('admin'), createTrip);

router.put('/:id/complete', protect, authorize('admin'), completeTrip);

module.exports = router;
