const express = require('express');
const router = express.Router();
const { createTrip, getTrips, completeTrip } = require('../controllers/tripController');

router.route('/')
    .get(getTrips)
    .post(createTrip);

router.put('/:id/complete', completeTrip);

module.exports = router;
