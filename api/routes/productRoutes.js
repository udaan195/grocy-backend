const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
// --- FIX: अपने सही किए हुए authMiddleware से तीनों फंक्शन import करें ---
const { protect, admin, vendor } = require('../../middleware/authMiddleware');

// यह फंक्शन स्पेशल कैरेक्टर्स को escape करता है
function escapeRegex(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.keyword) {
            filter.name = { $regex: escapeRegex(req.query.keyword), $options: 'i' };
        }
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        const products = await Product.find(filter).populate('vendor', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Fetch products for a specific vendor
// @route   GET /api/products/myproducts
// @access  Private/Vendor
router.get('/myproducts', protect, vendor, async (req, res) => {
    // protect और vendor middleware यह सुनिश्चित करेंगे कि सिर्फ लॉग-इन वेंडर ही यहाँ आ पाए
    const products = await Product.find({ vendor: req.user._id });
    res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('vendor', 'name');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(404).json({ message: 'Product not found' });
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Vendor
router.post('/', protect, vendor, async (req, res) => {
    // --- FIX: सिर्फ वेंडर या एडमिन ही प्रोडक्ट बना सकता है ---
    try {
        const { name, price, category, image, unit, minBuyQuantity, maxBuyQuantity } = req.body;
        const product = new Product({
            name, price, category, image, unit,
            minBuyQuantity: minBuyQuantity || 1,
            maxBuyQuantity: maxBuyQuantity || null,
            vendor: req.user._id,
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Vendor/Admin
router.put('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            // यह लॉजिक सही है: सिर्फ प्रोडक्ट का मालिक (वेंडर) या एडमिन ही अपडेट कर सकता है
            if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized' });
            }
            const { name, price, category, image, unit, minBuyQuantity, maxBuyQuantity } = req.body;
            product.name = name || product.name;
            product.price = price || product.price;
            product.category = category || product.category;
            product.image = image || product.image;
            product.unit = unit;
            product.minBuyQuantity = minBuyQuantity || 1;
            product.maxBuyQuantity = maxBuyQuantity || null;
            
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Vendor/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            // यह लॉजिक सही है: सिर्फ प्रोडक्ट का मालिक (वेंडर) या एडमिन ही डिलीट कर सकता है
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

// backend/api/routes/productRoutes.js में जोड़ें

// @desc    Fetch products by a list of IDs
// @route   POST /api/products/byIds
// @access  Public
router.post('/byIds', async (req, res) => {
    const { ids } = req.body; // frontend से IDs की लिस्ट आएगी

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'Please provide an array of product IDs' });
    }
    try {
        const products = await Product.find({ '_id': { $in: ids } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// module.exports = router; // यह लाइन सबसे नीचे रहेगी

module.exports = router;
