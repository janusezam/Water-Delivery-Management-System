const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser, getProfile, updateProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Profile routes (must be before /:id to avoid conflicts)
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile);

router.route('/')
    .get(protect, authorize('admin', 'staff'), getUsers);

router.route('/:id')
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
