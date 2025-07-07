const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const { protect } = require('../../middleware/authMiddleware');
const { admin } = require('../../middleware/adminMiddleware');

// यह फंक्शन स्पेशल कैरेक्टर्स को escape करता है
function escapeRegex(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET /api/products - सभी प्रोडक्ट्स दिखाएगा (ग्राहक के लिए)
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

// GET /api/products/myproducts - सिर्फ वेंडर के प्रोडक्ट्स दिखाएगा
router.get('/myproducts', protect, async (req, res) => {
    // सिर्फ वही प्रोडक्ट ढूंढो जिसका वेंडर लॉग-इन किया हुआ यूजर है
    const products = await Product.find({ vendor: req.user._id });
    res.json(products);
});

// GET /api/products/:id - एक प्रोडक्ट की जानकारी दिखाएगा
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


// POST /api/products - नया प्रोडक्ट बनाएगा
router.post('/', protect, async (req, res) => {
    try {
        const { name, price, category, image, unit, minBuyQuantity, maxBuyQuantity } = req.body;
        const product = new Product({
            name, price, category, image, unit,
            minBuyQuantity: minBuyQuantity || 1,
            maxBuyQuantity: maxBuyQuantity || null,
            vendor: req.user._id, // प्रोडक्ट को लॉग-इन यूजर (वेंडर) से जोड़ें
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/products/:id - प्रोडक्ट अपडेट करेगा
router.put('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            // जांचें: क्या यह यूजर इस प्रोडक्ट का मालिक है या एडमिन है?
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

// DELETE /api/products/:id - प्रोडक्ट डिलीट करेगा
router.delete('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            // जांचें: क्या यह यूजर इस प्रोडक्ट का मालिक है या एडमिन है?
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
