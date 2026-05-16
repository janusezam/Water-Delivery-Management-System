const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    verifyActivation,
    resendOTP,
    loginUser, 
    googleLogin,
    forgotPassword,
    verifyOTP,
    resetPassword,
    loginAdmin 
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-activation', verifyActivation);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/admin/login', loginAdmin);

module.exports = router;

