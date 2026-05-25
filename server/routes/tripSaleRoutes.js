const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createTrip,
    getTrips,
    getMyActiveTrip,
    getTripById,
    recordSale,
    endTrip,
    completeTrip,
    cancelTrip
} = require('../controllers/tripSaleController');

router.post('/', protect, authorize('admin', 'staff'), createTrip);
router.get('/', protect, authorize('admin', 'staff', 'driver'), getTrips);
router.get('/my-active', protect, authorize('driver'), getMyActiveTrip);
router.get('/:id', protect, authorize('admin', 'staff', 'driver'), getTripById);

router.post('/:id/sell', protect, authorize('driver'), recordSale);
router.put('/:id/end', protect, authorize('driver'), endTrip);

router.put('/:id/complete', protect, authorize('admin', 'staff'), completeTrip);
router.put('/:id/cancel', protect, authorize('admin'), cancelTrip);

module.exports = router;
