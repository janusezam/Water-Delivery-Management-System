const Product = require('../models/Product');
const { notifyRoles } = require('../utils/notificationHelper');

const LOW_STOCK_THRESHOLD = 10;

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// @desc    Create a product
// @route   POST /api/products
const createProduct = async (req, res) => {
    const { name, type, pricePerUnit, stockQty, containerDeposit } = req.body;
    try {
        const imageUrl = req.file ? req.file.path : null;
        const product = await Product.create({
            name, type, pricePerUnit, stockQty, containerDeposit, imageUrl
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Create Product Error:', error);
        res.status(400).json({ message: 'Error creating product' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = req.body.name || product.name;
            product.type = req.body.type || product.type;
            product.pricePerUnit = req.body.pricePerUnit || product.pricePerUnit;
            product.stockQty = req.body.stockQty || product.stockQty;
            product.containerDeposit = req.body.containerDeposit || product.containerDeposit;
            
            if (req.file) {
                product.imageUrl = req.file.path;
            }

            const updatedProduct = await product.save();

            // --- Notifications ---
            // Check for low stock after update
            if (updatedProduct.stockQty <= LOW_STOCK_THRESHOLD && updatedProduct.stockQty > 0) {
                notifyRoles({
                    roles: ['admin', 'staff'],
                    type: 'low_stock',
                    title: 'Low Stock Alert',
                    message: `⚠️ ${updatedProduct.name} stock is low (${updatedProduct.stockQty} remaining)`,
                    relatedModel: 'Product',
                    relatedId: updatedProduct._id
                });
            } else if (updatedProduct.stockQty <= 0) {
                notifyRoles({
                    roles: ['admin', 'staff'],
                    type: 'low_stock',
                    title: 'Out of Stock!',
                    message: `🚨 ${updatedProduct.name} is out of stock!`,
                    relatedModel: 'Product',
                    relatedId: updatedProduct._id
                });
            }

            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(400).json({ message: 'Error updating product' });
    }
};

// @desc    Soft delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isActive = false;
            await product.save();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error removing product' });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
