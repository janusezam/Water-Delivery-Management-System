const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
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
