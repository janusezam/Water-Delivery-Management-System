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

const sendEmail = async ({ to, subject, text, html }) => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `AquaDeliver <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
    };

    return transporter.sendMail(mailOptions);
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, mobileNumber, password, recaptchaToken } = req.body;

        if (!firstName || !lastName || !email || !mobileNumber || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            if (!userExists.isActivated) {
                // If account exists but not activated, update credentials and send a new OTP
                userExists.firstName = firstName;
                userExists.lastName = lastName;
                userExists.mobileNumber = mobileNumber;
                userExists.password = password; // Pre-save hook will hash this
                
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                userExists.activationOTP = otp;
                userExists.activationOTPExpires = Date.now() + 1 * 60 * 1000; // 1 minute
                await userExists.save();

                try {
                    await sendEmail({
                        to: userExists.email,
                        subject: 'AquaDeliver Account Activation OTP',
                        text: `Your new activation OTP is: ${otp}. It will expire in 1 minute.`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h2 style="color: #3b82f6;">Activate Your Account</h2>
                                <p>Your registration details have been updated. Please use the following code to activate your account:</p>
                                <div style="font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; margin: 20px 0;">
                                    ${otp}
                                </div>
                                <p>This code will expire in 1 minute.</p>
                            </div>
                        `
                    });
                    return res.status(200).json({ 
                        message: 'Account details updated. A new OTP has been sent to your email.',
                        requiresActivation: true,
                        email: userExists.email
                    });
                } catch (emailError) {
                    return res.status(200).json({ 
                        message: 'Account details updated but failed to send OTP. Please try logging in to trigger a new code.',
                        requiresActivation: true,
                        email: userExists.email
                    });
                }
            }
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 1 * 60 * 1000; // 1 minute

        const user = await User.create({
            firstName,
            lastName,
            email,
            mobileNumber,
            password,
            role: 'user', // Default role
            activationOTP: otp,
            activationOTPExpires: otpExpires,
            isActivated: false
        });

        if (user) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'AquaDeliver Account Activation OTP',
                    text: `Your activation OTP is: ${otp}. It will expire in 1 minute.`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #3b82f6;">Welcome to AquaDeliver!</h2>
                            <p>Thank you for registering. Please use the following code to activate your account:</p>
                            <div style="font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p>This code will expire in 1 minute.</p>
                        </div>
                    `
                });

                res.status(201).json({
                    message: 'Registration successful! Please check your email for the activation OTP.',
                    email: user.email
                });
            } catch (emailError) {
                console.error('Error sending activation email:', emailError);
                res.status(201).json({
                    message: 'User registered but failed to send activation email. Please contact support.',
                    email: user.email
                });
            }
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: error.message || 'Server error during registration' });
    }
};

// @desc    Verify activation OTP
// @route   POST /api/auth/verify-activation
// @access  Public
const verifyActivation = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActivated) {
        return res.status(400).json({ message: 'Account is already activated' });
    }

    if (user.activationOTP !== otp || user.activationOTPExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isActivated = true;
    user.activationOTP = undefined;
    user.activationOTPExpires = undefined;
    await user.save();

    res.json({
        message: 'Account activated successfully! You can now log in.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
    });
};

// @desc    Resend activation OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActivated) {
        return res.status(400).json({ message: 'Account is already activated' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.activationOTP = otp;
    user.activationOTPExpires = Date.now() + 1 * 60 * 1000; // 1 minute
    await user.save();

    try {
        await sendEmail({
            to: user.email,
            subject: 'AquaDeliver Account Activation OTP',
            text: `Your new activation OTP is: ${otp}. It will expire in 1 minute.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">AquaDeliver Activation Code</h2>
                    <p>You requested a new activation code. Please use the following code to activate your account:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 1 minute.</p>
                </div>
            `
        });
        res.json({ message: 'New OTP sent to email' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Error sending email' });
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
        if (!user.isActivated) {
            return res.status(403).json({ 
                message: 'Account not activated. Please verify your email.',
                requiresActivation: true,
                email: user.email
            });
        }

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
    const { tokenId, accessToken, role } = req.body;
    console.log('Received Google Login Request:', tokenId ? 'ID Token' : accessToken ? 'Access Token' : 'NO TOKEN');

    try {
        let name, email, googleId;

        if (tokenId) {
            // Standard <GoogleLogin /> path (ID Token)
            const ticket = await client.verifyIdToken({
                idToken: tokenId,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            googleId = payload.sub;
            console.log('Google ID Token Verified successfully');
        } else if (accessToken) {
            // Custom button path (Access Token)
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            name = response.data.name;
            email = response.data.email;
            googleId = response.data.sub;
            console.log('Google Access Token Verified successfully');
        } else {
            return res.status(400).json({ message: 'No token provided' });
        }

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
    user.resetPasswordExpires = Date.now() + 1 * 60 * 1000; // 1 minute
    await user.save();

    try {
        await sendEmail({
            to: user.email,
            subject: 'AquaDeliver Password Reset Code',
            text: `Your password reset code is: ${otp}. It will expire in 1 minute.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">Password Reset Request</h2>
                    <p>You requested a password reset. Please use the following code to proceed:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 1 minute.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `
        });
        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        console.error('Error sending reset email:', error);
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
        if (!user.isActivated) {
            return res.status(403).json({ 
                message: 'Admin account not activated. Please contact system administrator.',
            });
        }

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
    verifyActivation,
    resendOTP,
    loginUser,
    googleLogin,
    forgotPassword,
    verifyOTP,
    resetPassword,
    loginAdmin
};

