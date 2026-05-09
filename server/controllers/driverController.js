const Driver = require('../models/Driver');
const User = require('../models/User');
const DriverLocation = require('../models/DriverLocation');

// @desc    Get all drivers with user info
// @route   GET /api/drivers
const getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({}).populate('user', 'name email');
        
        // Fetch locations for each driver
        const driversWithLocation = await Promise.all(drivers.map(async (driver) => {
            // The socket stores location keyed by User._id (from driver dashboard),
            // so we must query by the user's _id, not the Driver model's _id
            const userId = driver.user?._id || driver.user;
            const location = await DriverLocation.findOne({ driver: userId });
            return {
                ...driver.toObject(),
                location: location ? {
                    lat: location.lat,
                    lng: location.lng,
                    heading: location.heading,
                    updatedAt: location.updatedAt
                } : null
            };
        }));

        res.json(driversWithLocation);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'Error fetching drivers' });
    }
};

// @desc    Create a driver profile
// @route   POST /api/drivers
const createDriver = async (req, res) => {
    const { userId, name, email, password, licenseNo, vehicleType, plateNo } = req.body;
    try {
        let finalUserId = userId;

        // If no userId but we have account details, create the user first
        if (!finalUserId && email && password) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
            const newUser = await User.create({
                name,
                email,
                password,
                role: 'driver'
            });
            finalUserId = newUser._id;
        }

        // Ensure user exists and has driver role
        const user = await User.findById(finalUserId);
        if (!user || user.role !== 'driver') {
            return res.status(400).json({ message: 'Invalid user or role. User must have "driver" role.' });
        }

        const driver = await Driver.create({
            user: finalUserId,
            licenseNo: licenseNo || 'N/A',
            vehicleType,
            plateNo
        });
        
        const populatedDriver = await Driver.findById(driver._id).populate('user', 'name email');
        res.status(201).json(populatedDriver);
    } catch (error) {
        console.error('Create Driver Error:', error);
        res.status(400).json({ message: 'Error creating driver profile' });
    }
};

// @desc    Update driver status
// @route   PUT /api/drivers/:id/status
const updateDriverStatus = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (driver) {
            driver.status = req.body.status || driver.status;
            const updatedDriver = await driver.save();
            res.json(updatedDriver);
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating status' });
    }
};

// @desc    Update driver profile
// @route   PUT /api/drivers/:id
const updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (driver) {
            driver.vehicleType = req.body.vehicleType || driver.vehicleType;
            driver.plateNo = req.body.plateNo || driver.plateNo;
            driver.licenseNo = req.body.licenseNo || driver.licenseNo;
            
            const updatedDriver = await driver.save();
            const populatedDriver = await Driver.findById(updatedDriver._id).populate('user', 'name email');
            res.json(populatedDriver);
        } else {
            res.status(404).json({ message: 'Driver not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating driver' });
    }
};

module.exports = {
    getDrivers,
    createDriver,
    updateDriverStatus,
    updateDriver
};
