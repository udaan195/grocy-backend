const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { protect } = require('../../middleware/authMiddleware');
const { admin } = require('../../middleware/adminMiddleware');

function escapeRegex(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET /api/products - सभी प्रोडक्ट्स
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.keyword) {
            filter.name = { $regex: escapeRegex(req.query.keyword), $options: 'i' };
        }
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/products/:id - एक प्रोडक्ट
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


// POST, PUT, DELETE routes... (बाकी के सभी रूट्स पहले जैसे ही रहेंगे)
// ...

module.exports = router;
