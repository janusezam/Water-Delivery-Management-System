const TripSale = require('../models/TripSale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

// @desc    Create new trip
// @route   POST /api/trip-sales
const createTrip = async (req, res) => {
    try {
        const { driver, loadedItems, notes } = req.body;

        // 1. Check stock for all items
        for (const item of loadedItems) {
            const product = await Product.findById(item.product);
            if (!product || product.stockQty < item.qtyLoaded) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${product ? product.name : 'Unknown Product'}` 
                });
            }
        }

        // 2. Create the trip record
        const trip = await TripSale.create({
            driver,
            createdBy: req.user._id,
            loadedItems,
            notes,
            status: 'active',
            startedAt: Date.now()
        });

        // 3. Deduct stock
        for (const item of loadedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQty: -item.qtyLoaded }
            });
        }

        // 4. Update Driver status
        await Driver.findOneAndUpdate({ user: driver }, { status: 'on-trip' });

        res.status(201).json(trip);
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ message: 'Error creating trip', error: error.message, stack: error.stack });
    }
};

// @desc    Get all trips
// @route   GET /api/trip-sales
const getTrips = async (req, res) => {
    try {
        let query = {};
        if (req.user && req.user.role === 'driver') {
            query = { driver: req.user._id };
        }

        const trips = await TripSale.find(query)
            .populate('driver', 'name email')
            .populate('createdBy', 'name email')
            .populate('loadedItems.product', 'name imageUrl pricePerUnit')
            .populate('sales.items.product', 'name imageUrl')
            .sort({ createdAt: -1 });
        res.json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'Error fetching trips' });
    }
};

// @desc    Get driver's active trip
// @route   GET /api/trip-sales/my-active
const getMyActiveTrip = async (req, res) => {
    try {
        const trip = await TripSale.findOne({
            driver: req.user._id,
            status: { $in: ['active', 'pending_review'] }
        })
        .populate('driver', 'name email')
        .populate('loadedItems.product', 'name pricePerUnit imageUrl')
        .populate('sales.items.product', 'name imageUrl');

        if (!trip) {
            return res.status(200).json(null);
        }
        res.json(trip);
    } catch (error) {
        console.error('Error fetching active trip:', error);
        res.status(500).json({ message: 'Error fetching active trip' });
    }
};

// @desc    Get trip by ID
// @route   GET /api/trip-sales/:id
const getTripById = async (req, res) => {
    try {
        const trip = await TripSale.findById(req.params.id)
            .populate('driver', 'name email')
            .populate('createdBy', 'name email')
            .populate('loadedItems.product', 'name type imageUrl pricePerUnit')
            .populate('sales.items.product', 'name type imageUrl')
            .populate('sales.customer', 'name');

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        res.json(trip);
    } catch (error) {
        console.error('Error fetching trip:', error);
        res.status(500).json({ message: 'Error fetching trip' });
    }
};

// @desc    Record a sale during trip
// @route   POST /api/trip-sales/:id/sell
const recordSale = async (req, res) => {
    try {
        const tripId = req.params.id;
        const { customerName, customer, items, paymentMethod, totalAmount, jugsCollected, notes } = req.body;

        const trip = await TripSale.findById(tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status !== 'active') return res.status(400).json({ message: 'Cannot record sale for inactive trip' });

        // Calculate currently sold qty per product to validate remaining loaded stock
        const soldCounts = {};
        trip.sales.forEach(sale => {
            sale.items.forEach(item => {
                soldCounts[item.product] = (soldCounts[item.product] || 0) + item.qty;
            });
        });

        for (const item of items) {
            const loadedItem = trip.loadedItems.find(l => l.product.toString() === item.product);
            if (!loadedItem) return res.status(400).json({ message: `Product ${item.product} was not loaded on this trip.` });
            
            const currentlySold = soldCounts[item.product] || 0;
            if (currentlySold + item.qty > loadedItem.qtyLoaded) {
                return res.status(400).json({ message: `Cannot sell more qty than loaded for this product.` });
            }
        }

        const newSale = {
            customerName: customerName || 'Walk-up Customer',
            customer: customer || null,
            items,
            jugsCollected: customer ? (jugsCollected || 0) : 0, // only track if customer linked
            paymentMethod: paymentMethod || 'cash',
            totalAmount,
            notes
        };

        trip.sales.push(newSale);
        
        // Update customer jug balance if linked
        if (customer) {
            const jugsOut = items.reduce((sum, item) => sum + item.qty, 0); // Assuming all items are refills
            const jugsIn = newSale.jugsCollected || 0;
            const balanceDelta = jugsOut - jugsIn;
            if (balanceDelta !== 0) {
                await Customer.findByIdAndUpdate(customer, {
                    $inc: { jugBalance: balanceDelta }
                });
            }
        }

        await trip.save();
        res.status(201).json(trip);
    } catch (error) {
        console.error('Error recording sale:', error);
        res.status(500).json({ message: 'Error recording sale', error: error.message });
    }
};

// @desc    End trip (driver marks as pending review)
// @route   PUT /api/trip-sales/:id/end
const endTrip = async (req, res) => {
    try {
        const trip = await TripSale.findByIdAndUpdate(req.params.id, {
            status: 'pending_review'
        }, { new: true });
        res.json(trip);
    } catch (error) {
        console.error('Error ending trip:', error);
        res.status(500).json({ message: 'Error ending trip' });
    }
};

// @desc    Complete trip (admin verifies and restores stock)
// @route   PUT /api/trip-sales/:id/complete
const completeTrip = async (req, res) => {
    try {
        const { returnedItems } = req.body; // Array of { product: id, qtyReturned: number }
        const trip = await TripSale.findById(req.params.id);
        
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status === 'completed' || trip.status === 'cancelled') {
            return res.status(400).json({ message: 'Trip is already finalized' });
        }

        let totalRevenue = 0;
        let totalJugsSold = 0;
        let totalJugsCollected = 0;

        // Calculate from sales
        trip.sales.forEach(sale => {
            totalRevenue += sale.totalAmount;
            totalJugsCollected += sale.jugsCollected;
            sale.items.forEach(item => {
                totalJugsSold += item.qty;
            });
        });

        let totalJugsReturned = 0;

        // Restore unsold stock based on admin input
        for (const rItem of returnedItems) {
            const loadedIndex = trip.loadedItems.findIndex(l => l.product.toString() === rItem.product);
            if (loadedIndex !== -1) {
                trip.loadedItems[loadedIndex].qtyReturned = rItem.qtyReturned;
                totalJugsReturned += rItem.qtyReturned;
                
                await Product.findByIdAndUpdate(rItem.product, {
                    $inc: { stockQty: rItem.qtyReturned }
                });
            }
        }

        trip.status = 'completed';
        trip.completedAt = Date.now();
        trip.totalRevenue = totalRevenue;
        trip.totalJugsSold = totalJugsSold;
        trip.totalJugsReturned = totalJugsReturned;
        trip.totalJugsCollected = totalJugsCollected;

        await trip.save();

        // Update Driver status
        await Driver.findOneAndUpdate({ user: trip.driver }, { status: 'available' });

        res.json(trip);
    } catch (error) {
        console.error('Error completing trip:', error);
        res.status(500).json({ message: 'Error completing trip' });
    }
};

// @desc    Cancel trip
// @route   PUT /api/trip-sales/:id/cancel
const cancelTrip = async (req, res) => {
    try {
        const trip = await TripSale.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.status === 'completed') return res.status(400).json({ message: 'Cannot cancel completed trip' });

        // Restore ALL loaded stock
        for (const item of trip.loadedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQty: item.qtyLoaded }
            });
        }

        trip.status = 'cancelled';
        await trip.save();

        // Update Driver status
        await Driver.findOneAndUpdate({ user: trip.driver }, { status: 'available' });

        res.json(trip);
    } catch (error) {
        console.error('Error cancelling trip:', error);
        res.status(500).json({ message: 'Error cancelling trip' });
    }
};

module.exports = {
    createTrip,
    getTrips,
    getMyActiveTrip,
    getTripById,
    recordSale,
    endTrip,
    completeTrip,
    cancelTrip
};
