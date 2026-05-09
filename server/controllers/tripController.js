const Trip = require('../models/Trip');
const Order = require('../models/Order');
const Driver = require('../models/Driver');

// @desc    Create a new trip (assign orders to driver)
// @route   POST /api/trips
const createTrip = async (req, res) => {
    const { driverId, orderIds, startKm } = req.body;
    try {
        const driver = await Driver.findById(driverId);
        if (!driver || driver.status === 'on-trip') {
            return res.status(400).json({ message: 'Driver is not available' });
        }

        const trip = await Trip.create({
            driver: driverId,
            orders: orderIds,
            startKm,
            startTime: new Date(),
            status: 'ongoing'
        });

        // Update driver status
        driver.status = 'on-trip';
        await driver.save();

        // Update orders status to dispatched and link to driver
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { 
                $set: { 
                    status: 'dispatched',
                    driver: driverId
                } 
            }
        );

        res.status(201).json(trip);
    } catch (error) {
        console.error('Trip Error:', error);
        res.status(400).json({ message: 'Error creating trip' });
    }
};

// @desc    Get all trips
// @route   GET /api/trips
const getTrips = async (req, res) => {
    try {
        const trips = await Trip.find({})
            .populate({
                path: 'driver',
                populate: { path: 'user', select: 'name' }
            })
            .populate('orders')
            .sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trips' });
    }
};

// @desc    Complete a trip
// @route   PUT /api/trips/:id/complete
const completeTrip = async (req, res) => {
    const { endKm, notes } = req.body;
    try {
        const trip = await Trip.findById(req.params.id);
        if (trip) {
            trip.status = 'completed';
            trip.endTime = new Date();
            trip.endKm = endKm;
            trip.kmTraveled = endKm - trip.startKm;
            trip.notes = notes;
            
            await trip.save();

            // Update driver back to available
            await Driver.findByIdAndUpdate(trip.driver, { status: 'available' });

            res.json(trip);
        } else {
            res.status(404).json({ message: 'Trip not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error completing trip' });
    }
};

module.exports = {
    createTrip,
    getTrips,
    completeTrip
};
