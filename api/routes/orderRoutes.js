const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const { protect, admin } = require('../../middleware/authMiddleware');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_CHAT_ID;
let bot;
if (token) { bot = new TelegramBot(token); }

router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount, isPaid, paidAt, paymentResult } = req.body;
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }
        const productDetails = await Product.findById(orderItems[0].productId);
        if (!productDetails) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const vendorId = productDetails.vendor;
        const order = new Order({
            user: req.user._id,
            vendor: vendorId,
            orderItems, shippingAddress, paymentMethod, totalAmount, isPaid, paidAt, paymentResult
        });
        const createdOrder = await order.save();
        if (bot && adminChatId) {
            // Telegram logic...
        }
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(400).json({ message: error.message });
    }
});

// ... (बाकी के सभी GET और PUT रूट्स)

module.exports = router;


router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).populate('vendor', 'name').sort({ createdAt: -1 });
    res.json(orders);
});

router.get('/vendor', protect, async (req, res) => {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized' });
    }
    const filter = (req.user.role === 'admin') ? {} : { vendor: req.user._id };
    const orders = await Order.find(filter).populate('user', 'name').sort({ createdAt: -1 });
    res.json(orders);
});

router.put('/:id/status', protect, async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
        if (req.user.role !== 'admin' && order.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        order.status = req.body.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

module.exports = router;

