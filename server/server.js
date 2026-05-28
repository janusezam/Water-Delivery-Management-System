require('dotenv').config();
const express = require('express');

const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const walkInRoutes = require('./routes/walkInRoutes');
const driverRoutes = require('./routes/driverRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const tripSaleRoutes = require('./routes/tripSaleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// --- Express 5-safe sanitization helpers ---
// Recursively strip HTML/script tags from strings in an object
function stripXss(obj) {
    if (typeof obj === 'string') {
        return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<\/?[^>]+(>|$)/g, '');
    }
    if (Array.isArray(obj)) return obj.map(stripXss);
    if (obj !== null && typeof obj === 'object') {
        const clean = {};
        for (const key of Object.keys(obj)) {
            clean[key] = stripXss(obj[key]);
        }
        return clean;
    }
    return obj;
}

// Safely sanitize a read-only query object in-place (Express 5)
function sanitizeQueryInPlace(query, sanitizeFn) {
    const sanitized = sanitizeFn({ ...query });
    for (const key of Object.keys(query)) {
        delete query[key];
    }
    Object.assign(query, sanitized);
}


connectDB();


const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));
app.use(helmet());
app.use(express.json());

// Custom NoSQL sanitize middleware (Express 5 compatible)
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
    if (req.query) sanitizeQueryInPlace(req.query, mongoSanitize.sanitize);
    next();
});

// Custom XSS sanitize middleware (Express 5 compatible)
app.use((req, res, next) => {
    if (req.body) req.body = stripXss(req.body);
    if (req.params) req.params = stripXss(req.params);
    if (req.query) sanitizeQueryInPlace(req.query, stripXss);
    next();
});

// Fix for Google Login COOP issue
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/walkin', walkInRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trip-sales', tripSaleRoutes);
app.use('/api/notifications', notificationRoutes);


// Socket.IO — store globally so notification helper can emit from any controller
global._io = io;
socketHandler(io);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
