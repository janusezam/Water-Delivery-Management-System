const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get all orders
// @route   GET /api/orders
const getOrders = async (req, res) => {
    try {
        let query = {};
        
        // If user is a customer, only show their own orders
        if (req.user && req.user.role === 'user') {
            query = { 
                $or: [
                    { user: req.user._id },
                    { customerName: req.user.name } // Match by name for legacy orders
                ]
            };
        }

        // If user is a driver, only show orders assigned to them
        if (req.user && req.user.role === 'driver') {
            query = { assignedDriver: req.user._id };
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('assignedDriver', 'name email')
            .populate('items.product', 'name pricePerUnit')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// @desc    Create new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
    try {
        const { customerName, address, items, coordinates, totalAmount, customer: customerId, deliveryAddress } = req.body;

        let resolvedCustomerName = customerName;
        let resolvedAddress = address || deliveryAddress;
        let resolvedUserId = null;
        let resolvedCustomerId = customerId || null;

        // If a customerId is provided (admin creating order for a customer),
        // look up the customer name from the Customer model
        if (customerId) {
            const customerDoc = await Customer.findById(customerId);
            if (customerDoc) {
                resolvedCustomerName = customerDoc.name;
                // Use customer's first address if none provided
                if (!resolvedAddress && customerDoc.addresses?.length > 0) {
                    const addr = customerDoc.addresses[0];
                    resolvedAddress = `${addr.street}, ${addr.barangay}`;
                }
            }
        }

        // If user role is placing the order themselves, link their User ID
        if (req.user?.role === 'user') {
            resolvedUserId = req.user._id;
            resolvedCustomerName = resolvedCustomerName || req.user.name;
            // Try to find a matching Customer record for this user
            if (!resolvedCustomerId) {
                const custByUser = await Customer.findOne({ user: req.user._id });
                if (custByUser) resolvedCustomerId = custByUser._id;
                else {
                    // Fallback: match by name
                    const custByName = await Customer.findOne({ name: resolvedCustomerName });
                    if (custByName) resolvedCustomerId = custByName._id;
                }
            }
        }

        if (!resolvedCustomerName) {
            return res.status(400).json({ message: 'Customer name is required' });
        }
        if (!resolvedAddress) {
            return res.status(400).json({ message: 'Delivery address is required' });
        }

        const order = new Order({
            customerName: resolvedCustomerName,
            user: resolvedUserId,
            customer: resolvedCustomerId,
            address: resolvedAddress,
            items: items || [],
            totalAmount: totalAmount || 0,
            coordinates,
            status: 'Pending'
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            message: 'Error creating order', 
            error: error.message 
        });
    }
};

// @desc    Update order status & proof
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const currentOrder = await Order.findById(orderId);
        
        if (!currentOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = currentOrder.status;
        const newStatus = req.body.status;
        
        // Build update payload
        const updateData = {};
        if (newStatus) updateData.status = newStatus;
        
        const assignedDriverId = req.body.assignedDriver !== undefined ? req.body.assignedDriver : currentOrder.assignedDriver;
        
        // Validation: Driver-only statuses require an assigned driver
        const driverOnlyStatuses = ['Delivering', 'Completed', 'delivered', 'Failed Attempt'];
        if (newStatus && driverOnlyStatuses.includes(newStatus) && !assignedDriverId) {
            return res.status(400).json({ 
                message: `Status '${newStatus}' requires an assigned driver.` 
            });
        }

        // Validation: Cannot assign driver if Pending
        const targetStatus = newStatus || oldStatus;
        if (targetStatus === 'Pending' && assignedDriverId) {
            return res.status(400).json({ 
                message: "Drivers cannot be assigned to Pending orders. Dispatch the order first." 
            });
        }

        // Validation: Users can only cancel if Pending
        if (req.user && req.user.role === 'user') {
            if (newStatus && newStatus !== 'Cancelled') {
                return res.status(403).json({ message: 'Users are only authorized to cancel their orders.' });
            }
            if (newStatus === 'Cancelled') {
                if (oldStatus !== 'Pending') {
                    return res.status(400).json({ 
                        message: `Order cannot be cancelled once it is ${oldStatus}.` 
                    });
                }
                if (!req.body.cancelReason) {
                    return res.status(400).json({ message: 'Cancellation reason is required.' });
                }
            }
            // Prevent users from updating other fields
            delete req.body.assignedDriver;
            delete req.body.customerName;
            delete req.body.address;
        }

        if (req.body.assignedDriver !== undefined) {
            updateData.assignedDriver = req.body.assignedDriver || null;
        }
        if (req.body.customerName) updateData.customerName = req.body.customerName;
        if (req.body.address) updateData.address = req.body.address;
        if (req.file) updateData.deliveryProofUrl = req.file.path;
        if (req.body.failedReason !== undefined) updateData.failedReason = req.body.failedReason;
        if (req.body.failedNote !== undefined) updateData.failedNote = req.body.failedNote;
        if (req.body.cancelReason !== undefined) updateData.cancelReason = req.body.cancelReason;
        if (req.body.cancelMessage !== undefined) updateData.cancelMessage = req.body.cancelMessage;
        if (req.body.jugsReturned !== undefined) updateData.jugsReturned = req.body.jugsReturned;

        // Inventory Logic: Deduct stock when status moves to 'delivered' or 'Completed'
        const completionStatuses = ['delivered', 'Completed'];
        const isNowCompleted = completionStatuses.includes(newStatus);
        const wasAlreadyCompleted = completionStatuses.includes(oldStatus);

        if (isNowCompleted && !wasAlreadyCompleted) {
            // Deduct stock for each item
            if (Array.isArray(currentOrder.items)) {
                for (const item of currentOrder.items) {
                    if (item.product && item.qty > 0) {
                        await Product.findByIdAndUpdate(item.product, {
                            $inc: { stockQty: -item.qty }
                        });
                    }
                }
            }
        }
        
        // If status changes from completed back to something else (e.g. admin error), put stock back
        if (!isNowCompleted && wasAlreadyCompleted) {
            if (Array.isArray(currentOrder.items)) {
                for (const item of currentOrder.items) {
                    if (item.product && item.qty > 0) {
                        await Product.findByIdAndUpdate(item.product, {
                            $inc: { stockQty: item.qty }
                        });
                    }
                }
            }
        }

        // ── Jug Balance Logic ──
        // When delivery is completed: update Customer.jugBalance
        // jugsOut = total qty of non-deposit items (station containers going out)
        // jugsIn  = jugsReturned (empties the driver collected)
        // Balance delta = jugsOut - jugsIn
        if (isNowCompleted && !wasAlreadyCompleted) {
            // Find the linked customer
            let customerDoc = null;
            if (currentOrder.customer) {
                customerDoc = await Customer.findById(currentOrder.customer);
            }
            if (!customerDoc) {
                // Fallback: try to find by name
                customerDoc = await Customer.findOne({ name: currentOrder.customerName });
            }

            if (customerDoc) {
                const jugsOut = (currentOrder.items || []).reduce((sum, item) => {
                    // Only count non-deposit items (refills using station containers)
                    if (!item.payDeposit && item.qty > 0) return sum + item.qty;
                    return sum;
                }, 0);
                const jugsIn = req.body.jugsReturned || currentOrder.jugsReturned || 0;
                const balanceDelta = jugsOut - jugsIn;

                if (balanceDelta !== 0) {
                    await Customer.findByIdAndUpdate(customerDoc._id, {
                        $inc: { jugBalance: balanceDelta }
                    });
                }
            }
        }

        // If reversing a completed order, reverse the jug balance too
        if (!isNowCompleted && wasAlreadyCompleted) {
            let customerDoc = null;
            if (currentOrder.customer) {
                customerDoc = await Customer.findById(currentOrder.customer);
            }
            if (!customerDoc) {
                customerDoc = await Customer.findOne({ name: currentOrder.customerName });
            }

            if (customerDoc) {
                const jugsOut = (currentOrder.items || []).reduce((sum, item) => {
                    if (!item.payDeposit && item.qty > 0) return sum + item.qty;
                    return sum;
                }, 0);
                const jugsIn = currentOrder.jugsReturned || 0;
                const balanceDelta = jugsOut - jugsIn;

                if (balanceDelta !== 0) {
                    await Customer.findByIdAndUpdate(customerDoc._id, {
                        $inc: { jugBalance: -balanceDelta }
                    });
                }
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true, runValidators: false }
        )
        .populate('user', 'name email')
        .populate('assignedDriver', 'name email')
        .populate('items.product', 'name pricePerUnit');

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
};

// @desc    Delete an order
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Prevent deletion of active or completed orders
        const protectedStatuses = ['Dispatched', 'dispatched', 'Delivering', 'Completed', 'delivered'];
        if (protectedStatuses.includes(order.status)) {
            return res.status(400).json({ 
                message: `Cannot delete an order with status: ${order.status}. Please cancel it first.` 
            });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder
};
