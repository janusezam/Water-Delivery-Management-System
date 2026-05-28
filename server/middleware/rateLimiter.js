const rateLimit = require('express-rate-limit');

// Auth rate limiter
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth routes
    message: { message: 'Too many login attempts from this IP, please try again after 5 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter
};
