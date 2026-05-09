const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const verifyRecaptcha = async (token) => {
    if (!token) return false;
    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        );
        // For v3, we check success and score (threshold 0.5)
        return response.data.success && (response.data.score === undefined || response.data.score >= 0.5);
    } catch (error) {
        console.error('reCAPTCHA Verification Error:', error.message);
        return false;
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, recaptchaToken } = req.body;

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    if (role === 'admin') {
        return res.status(400).json({ message: 'Admin registration is not allowed here.' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'user'
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password, recaptchaToken } = req.body;

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    const { tokenId, role } = req.body;
    console.log('Received Google Token:', tokenId ? 'Token present' : 'Token MISSING');

    try {
        console.log('Audience being verified:', process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        console.log('Google Token Verified successfully');


        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                password: Math.random().toString(36).slice(-8), // Dummy password
                role: role || 'user'
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google Verification Error:', error.message);
        res.status(400).json({ message: 'Google login failed' });
    }
};


// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'WRS-DMS Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending email' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
        email, 
        resetPasswordOTP: otp,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ 
        email, 
        resetPasswordOTP: otp,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { email, password, recaptchaToken } = req.body;

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    const user = await User.findOne({ email });

    if (user && user.role === 'admin' && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Unauthorized or invalid credentials' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    forgotPassword,
    verifyOTP,
    resetPassword,
    loginAdmin
};

