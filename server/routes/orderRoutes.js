const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const { upload } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'staff', 'driver', 'user'), getOrders);
router.post('/', protect, createOrder);
router.put('/:id', protect, authorize('admin', 'staff', 'driver', 'user'), upload.single('deliveryProof'), updateOrder);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
