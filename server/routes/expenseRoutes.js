const express = require('express');
const router = express.Router();
const { logExpense, getExpenses, updateExpense, deleteExpense, getExpenseSummary, exportExpenses } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Dedicated Cloudinary storage for gas receipts
const receiptStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wrs_dms_gas_receipts',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    },
});

const receiptUpload = multer({ storage: receiptStorage });

// Static routes MUST come before :id routes
router.get('/summary', protect, getExpenseSummary);
router.get('/export', protect, exportExpenses);

// CRUD routes
router.route('/')
    .get(protect, getExpenses)
    .post(protect, receiptUpload.single('receiptPhoto'), logExpense);

router.route('/:id')
    .patch(protect, receiptUpload.single('receiptPhoto'), updateExpense)
    .delete(protect, authorize('admin'), deleteExpense);

module.exports = router;
