const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { protect, vendor, admin } = require('../../middleware/authMiddleware');

router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}).populate('vendor', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/byIds', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'IDs must be an array' });
    }
    try {
        const products = await Product.find({ '_id': { $in: ids } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/', protect, vendor, async (req, res) => {
    try {
        const { name, price, category, image, unit } = req.body;
        const product = new Product({
            name, price, category, image, unit,
            vendor: req.user._id,
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
