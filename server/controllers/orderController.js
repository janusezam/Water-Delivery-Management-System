const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const TripSale = require('../models/TripSale');
const User = require('../models/User');
const { createNotification, notifyRole, notifyRoles } = require('../utils/notificationHelper');

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

        const { page, limit, search, tab } = req.query;

        if (tab && req.user && req.user.role !== 'user') {
            const completionStatuses = ['delivered', 'Completed', 'Cancelled', 'cancelled'];
            if (tab === 'active') {
                query.status = { $nin: completionStatuses };
            } else if (tab === 'completed') {
                query.status = { $in: completionStatuses };
            }
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapedSearch, 'i');
            const searchOr = [
                { customerName: searchRegex },
                { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapedSearch, options: 'i' } } }
            ];
            if (query.$or) {
                query = { $and: [query, { $or: searchOr }] };
            } else {
                query.$or = searchOr;
            }
        }

        if (page && limit) {
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const totalCount = await Order.countDocuments(query);
            const orders = await Order.find(query)
                .populate('user', 'name email')
                .populate('assignedDriver', 'name email')
                .populate('items.product', 'name pricePerUnit')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);

            return res.json({
                data: orders,
                totalPages: Math.ceil(totalCount / limitNum),
                currentPage: pageNum,
                totalCount
            });
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

        // --- Notifications ---
        // Notify admin & staff about new order
        notifyRoles({
            roles: ['admin', 'staff'],
            type: 'order_created',
            title: 'New Order',
            message: `New order from ${resolvedCustomerName}`,
            relatedModel: 'Order',
            relatedId: createdOrder._id,
            excludeUserId: req.user._id
        });

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
            const driverId = assignedDriverId || currentOrder.assignedDriver;
            let deductedFromTrip = false;

            // Check if the assigned driver has an active trip
            if (driverId) {
                const activeTrip = await TripSale.findOne({
                    driver: driverId,
                    status: 'active'
                });

                if (activeTrip) {
                    // Validate that the trip has enough remaining stock for each order item
                    const soldCounts = {};
                    activeTrip.sales.forEach(sale => {
                        sale.items.forEach(si => {
                            const pid = si.product.toString();
                            soldCounts[pid] = (soldCounts[pid] || 0) + si.qty;
                        });
                    });

                    let canFulfillFromTrip = true;
                    for (const item of currentOrder.items) {
                        if (!item.product || item.qty <= 0) continue;
                        const pid = item.product.toString();
                        const loadedItem = activeTrip.loadedItems.find(l => l.product.toString() === pid);
                        if (!loadedItem) { canFulfillFromTrip = false; break; }
                        const alreadySold = soldCounts[pid] || 0;
                        const remaining = loadedItem.qtyLoaded - alreadySold;
                        if (item.qty > remaining) { canFulfillFromTrip = false; break; }
                    }

                    if (canFulfillFromTrip) {
                        // Record this delivery as a sale in the trip
                        const tripSaleItems = currentOrder.items
                            .filter(i => i.product && i.qty > 0)
                            .map(i => ({ product: i.product, qty: i.qty, price: i.price || 0 }));

                        activeTrip.sales.push({
                            customerName: currentOrder.customerName,
                            customer: currentOrder.customer || null,
                            items: tripSaleItems,
                            totalAmount: currentOrder.totalAmount || 0,
                            paymentMethod: 'order',
                            orderId: currentOrder._id
                        });

                        await activeTrip.save();
                        deductedFromTrip = true;
                        // Do NOT deduct from warehouse — stock was already moved to truck when trip was created
                    }
                }
            }

            // Fallback: If no active trip or trip couldn't fulfill, deduct from warehouse
            if (!deductedFromTrip) {
                if (Array.isArray(currentOrder.items)) {
                    for (const item of currentOrder.items) {
                        if (item.product && item.qty > 0) {
                            const updatedProd = await Product.findByIdAndUpdate(
                                item.product,
                                { $inc: { stockQty: -item.qty } },
                                { new: true }
                            );

                            if (updatedProd && updatedProd.stockQty <= 10) {
                                notifyRoles({
                                    roles: ['admin', 'staff'],
                                    type: 'low_stock',
                                    title: updatedProd.stockQty <= 0 ? 'Out of Stock!' : 'Low Stock Alert',
                                    message: updatedProd.stockQty <= 0 
                                        ? `🚨 ${updatedProd.name} is out of stock!`
                                        : `⚠️ ${updatedProd.name} stock is low (${updatedProd.stockQty} remaining)`,
                                    relatedModel: 'Product',
                                    relatedId: updatedProd._id
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // If status changes from completed back to something else (e.g. admin error), reverse the deduction
        if (!isNowCompleted && wasAlreadyCompleted) {
            const driverId = currentOrder.assignedDriver;
            let reversedFromTrip = false;

            // Check if this order was recorded in a trip sale
            if (driverId) {
                const tripWithSale = await TripSale.findOne({
                    driver: driverId,
                    'sales.orderId': currentOrder._id
                });

                if (tripWithSale) {
                    // Remove the sale entry that was created for this order
                    tripWithSale.sales = tripWithSale.sales.filter(
                        s => !s.orderId || s.orderId.toString() !== currentOrder._id.toString()
                    );
                    await tripWithSale.save();
                    reversedFromTrip = true;
                }
            }

            // Fallback: If it wasn't in a trip, restore warehouse stock
            if (!reversedFromTrip) {
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

        // --- Notifications ---
        const orderRef = `Order #${orderId.toString().slice(-6).toUpperCase()}`;

        // 1) Driver assigned → notify the driver
        if (req.body.assignedDriver && req.body.assignedDriver !== currentOrder.assignedDriver?.toString()) {
            createNotification({
                recipientId: req.body.assignedDriver,
                type: 'order_assigned',
                title: 'New Delivery Assigned',
                message: `${orderRef} for ${currentOrder.customerName} has been assigned to you`,
                relatedModel: 'Order',
                relatedId: orderId
            });
            // Notify customer that driver is assigned
            if (currentOrder.user) {
                const driverUser = await User.findById(req.body.assignedDriver).select('name');
                createNotification({
                    recipientId: currentOrder.user,
                    type: 'order_assigned',
                    title: 'Driver Assigned',
                    message: `${driverUser?.name || 'A driver'} has been assigned to deliver your order`,
                    relatedModel: 'Order',
                    relatedId: orderId
                });
            }
        }

        // 2) Status changed
        if (newStatus && newStatus !== oldStatus) {
            // Delivery completed → notify admin + customer
            if (['delivered', 'Completed'].includes(newStatus)) {
                const driverName = updatedOrder.assignedDriver?.name || 'Driver';
                notifyRole({
                    role: 'admin',
                    type: 'delivery_completed',
                    title: 'Delivery Completed',
                    message: `${orderRef} delivered by ${driverName}`,
                    relatedModel: 'Order',
                    relatedId: orderId,
                    excludeUserId: req.user._id
                });
                if (currentOrder.user) {
                    createNotification({
                        recipientId: currentOrder.user,
                        type: 'delivery_completed',
                        title: 'Order Delivered',
                        message: `Your ${orderRef} has been delivered!`,
                        relatedModel: 'Order',
                        relatedId: orderId
                    });
                }
            }

            // Delivery failed → notify admin + customer
            if (newStatus === 'Failed Attempt') {
                const driverName = updatedOrder.assignedDriver?.name || 'Driver';
                notifyRole({
                    role: 'admin',
                    type: 'delivery_failed',
                    title: 'Delivery Failed',
                    message: `${orderRef} failed attempt by ${driverName}`,
                    relatedModel: 'Order',
                    relatedId: orderId,
                    excludeUserId: req.user._id
                });
                if (currentOrder.user) {
                    createNotification({
                        recipientId: currentOrder.user,
                        type: 'delivery_failed',
                        title: 'Delivery Attempt Failed',
                        message: `Delivery attempt for your ${orderRef} was unsuccessful`,
                        relatedModel: 'Order',
                        relatedId: orderId
                    });
                }
            }

            // Order cancelled → notify admin/staff + customer
            if (['Cancelled', 'cancelled'].includes(newStatus)) {
                notifyRoles({
                    roles: ['admin', 'staff'],
                    type: 'order_cancelled',
                    title: 'Order Cancelled',
                    message: `${orderRef} from ${currentOrder.customerName} has been cancelled`,
                    relatedModel: 'Order',
                    relatedId: orderId,
                    excludeUserId: req.user._id
                });
                // Notify assigned driver if any
                if (currentOrder.assignedDriver) {
                    createNotification({
                        recipientId: currentOrder.assignedDriver,
                        type: 'order_cancelled',
                        title: 'Order Cancelled',
                        message: `${orderRef} assigned to you has been cancelled`,
                        relatedModel: 'Order',
                        relatedId: orderId
                    });
                }
            }

            // Status change → notify customer about review/status update
            if (currentOrder.user && !['delivered', 'Completed', 'Failed Attempt', 'Cancelled', 'cancelled'].includes(newStatus)) {
                createNotification({
                    recipientId: currentOrder.user,
                    type: 'order_status',
                    title: 'Order Status Updated',
                    message: `Your ${orderRef} status changed to ${newStatus}`,
                    relatedModel: 'Order',
                    relatedId: orderId
                });
            }

            // Notify driver about status changes made by admin/staff
            if (currentOrder.assignedDriver && req.user._id.toString() !== currentOrder.assignedDriver.toString()
                && !['Cancelled', 'cancelled'].includes(newStatus)) {
                createNotification({
                    recipientId: currentOrder.assignedDriver,
                    type: 'order_status',
                    title: 'Order Status Updated',
                    message: `${orderRef} status changed to ${newStatus}`,
                    relatedModel: 'Order',
                    relatedId: orderId
                });
            }
        }

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
