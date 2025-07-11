const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { protect, vendor, admin } = require('../../middleware/authMiddleware');

// GET all products (Public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}).populate('vendor', 'name').sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET a single product by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(404).json({ message: 'Product not found' });
    }
});

// GET products for the logged-in vendor (Private/Vendor)
router.get('/myproducts', protect, vendor, async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user._id });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST to get products by a list of IDs (Used by Checkout)
router.post('/byIds', async (req, res) => {
    const { ids } = req.body;
    try {
        const products = await Product.find({ '_id': { $in: ids } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST to create a new product (Private/Vendor)
router.post('/', protect, vendor, async (req, res) => {
    try {
        const { name, price, description, category, image, unit, pcsCount, stock } = req.body;
        const product = new Product({
            name, price, description, category, image, unit, pcsCount, stock,
            vendor: req.user._id,
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT to update a product (Private/Vendor/Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, price, description, category, image, unit, pcsCount, stock } = req.body;
        const product = await Product.findById(req.params.id);
        if (product) {
            if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }
            product.name = name;
            product.price = price;
            product.description = description;
            product.category = category;
            product.image = image;
            product.unit = unit;
            product.pcsCount = pcsCount;
            product.stock = stock;
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a product (Private/Vendor/Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
