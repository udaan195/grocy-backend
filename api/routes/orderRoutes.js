const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Product = require('../models/productModel'); // यह ज़रूरी है
const { protect, admin, vendor } = require('../../middleware/authMiddleware');
const TelegramBot = require('node-telegram-bot-api');

// --- Telegram Bot Setup ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot;

if (token && chatId) {
    bot = new TelegramBot(token);
    console.log('Telegram Bot initialized for orders.');
} else {
    console.log('Telegram Bot not initialized: Missing credentials.');
}

// ----------------------------------------------------------------
// @desc    Create new order
// @route   POST /api/orders
// @access  Private (For logged-in customers)
// ----------------------------------------------------------------
router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount, isPaid, paidAt, paymentResult } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items in cart' });
        }

        // हर ऑर्डर आइटम में वेंडर की ID जोड़ने का लॉजिक
        const productIds = orderItems.map(item => item.product);
        const productsFromDB = await Product.find({ '_id': { $in: productIds } });

        const detailedOrderItems = orderItems.map(itemFromCart => {
            const productDetails = productsFromDB.find(p => p._id.toString() === itemFromCart.product);
            if (!productDetails) {
                throw new Error(`Product with ID ${itemFromCart.product} not found`);
            }
            return {
                ...itemFromCart,
                vendor: productDetails.vendor // हर आइटम के साथ वेंडर ID जोड़ें
            };
        });

        const order = new Order({
            user: req.user._id,
            orderItems: detailedOrderItems,
            shippingAddress,
            paymentMethod,
            totalAmount,
            isPaid: isPaid || false,
            paidAt: isPaid ? paidAt : null,
            paymentResult: paymentResult || {},
        });

        const createdOrder = await order.save();
        
        // --- Telegram Notification Logic ---
        if (bot) {
            try {
                let telegramMessage = `🚨 *New Order Received!* 🚨\n-----------------------------------\n*Order ID:* \`${createdOrder._id}\`\n*Customer:* ${shippingAddress.fullName}\n*Phone:* ${shippingAddress.phone}\n*Total:* ₹${totalAmount.toFixed(2)}\n-----------------------------------\n*Items (${orderItems.length}):*\n`;
                orderItems.forEach(item => { telegramMessage += `- ${item.name} (Qty: ${item.quantity})\n`; });
                telegramMessage += `-----------------------------------\n*Address:*\n${shippingAddress.address}, ${shippingAddress.area || ''}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`;
                await bot.sendMessage(chatId, telegramMessage, { parse_mode: 'Markdown' });
            } catch (telegramError) {
                console.error("Failed to send Telegram message:", telegramError.message);
            }
        }
        // --- Notification End ---

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error("Order Creation Error:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(400).json({ message: error.message || 'Server Error: Could not place order.' });
    }
});

// ----------------------------------------------------------------
// @desc    Get all orders (for Admin only)
// @route   GET /api/orders
// @access  Private/Admin
// ----------------------------------------------------------------
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ----------------------------------------------------------------
// @desc    Get logged in user (customer) orders
// @route   GET /api/orders/myorders
// @access  Private
// ----------------------------------------------------------------
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ----------------------------------------------------------------
// @desc    Get orders for a specific vendor
// @route   GET /api/orders/vendor
// @access  Private/Vendor
// ----------------------------------------------------------------
router.get('/vendor', protect, vendor, async (req, res) => {
    try {
        const orders = await Order.find({ "orderItems.vendor": req.user._id }).populate('user', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// ----------------------------------------------------------------
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
// ----------------------------------------------------------------
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            const isVendorOfOrder = order.orderItems.some(item => item.vendor.equals(req.user._id));
            if (order.user._id.equals(req.user._id) || req.user.role === 'admin' || isVendorOfOrder) {
                res.json(order);
            } else {
                res.status(403).json({ message: 'Not authorized to view this order' });
            }
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// ----------------------------------------------------------------
// @desc    Update order status (e.g., to Shipped, Delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor/Admin
// ----------------------------------------------------------------
router.put('/:id/status', protect, vendor, async (req, res) => { // 'vendor' middleware admin को भी allow करता है
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.status = req.body.status || order.status;
        if(req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// ----------------------------------------------------------------
// @desc    Cancel an order (sets status to 'Cancelled')
// @route   DELETE /api/orders/:id
// @access  Private/Admin
// ----------------------------------------------------------------
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if(order) {
            order.status = 'Cancelled';
            await order.save();
            res.json({ message: 'Order has been cancelled' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


module.exports = router;
