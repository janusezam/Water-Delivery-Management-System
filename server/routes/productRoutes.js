const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { upload } = require('../utils/cloudinary');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, authorize('admin', 'staff'), upload.single('image'), createProduct);

router.route('/:id')
    .put(protect, authorize('admin', 'staff'), upload.single('image'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
