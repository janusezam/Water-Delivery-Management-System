const Customer = require('../models/Customer');
const User = require('../models/User');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    let: { customerId: '$_id', customerName: '$name' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ['$customer', '$$customerId'] },
                                        { $eq: ['$customerName', '$$customerName'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: '$orders' }
                }
            },
            {
                $project: {
                    orders: 0
                }
            }
        ]);
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers' });
    }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customer' });
    }
};

// @desc    Create a customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
    const { name, phone, addresses, notes } = req.body;
    try {
        const customer = await Customer.create({
            name, phone, addresses, notes
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: 'Error creating customer' });
    }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            customer.name = req.body.name || customer.name;
            customer.phone = req.body.phone || customer.phone;
            customer.addresses = req.body.addresses || customer.addresses;
            customer.notes = req.body.notes || customer.notes;
            customer.jugBalance = req.body.jugBalance !== undefined ? req.body.jugBalance : customer.jugBalance;

            const updatedCustomer = await customer.save();

            // Sync with User model if linked
            if (updatedCustomer.user) {
                const userToUpdate = await User.findById(updatedCustomer.user);
                if (userToUpdate) {
                    userToUpdate.name = updatedCustomer.name;
                    userToUpdate.mobileNumber = updatedCustomer.phone;
                    
                    if (updatedCustomer.addresses && updatedCustomer.addresses.length > 0) {
                        const primaryAddr = updatedCustomer.addresses.find(a => a.isDefault) || updatedCustomer.addresses[0];
                        userToUpdate.address = {
                            street: primaryAddr.street,
                            barangay: primaryAddr.barangay,
                            city: primaryAddr.city,
                            lat: primaryAddr.lat,
                            lng: primaryAddr.lng
                        };
                    }
                    
                    // Also attempt to split name back to firstName and lastName
                    const nameParts = (updatedCustomer.name || '').trim().split(/\s+/);
                    if (nameParts.length > 0) {
                        userToUpdate.firstName = nameParts[0];
                        userToUpdate.lastName = nameParts.slice(1).join(' ');
                    }
                    
                    await userToUpdate.save();
                }
            }

            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating customer' });
    }
};

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer
};
