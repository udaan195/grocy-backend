// backend/api/routes/orderRoutes.js (Final Code)

const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Product = require('../models/productModel'); // Product मॉडल को import करें
const { protect } = require('../../middleware/authMiddleware');
const TelegramBot = require('node-telegram-bot-api');

// --- Telegram Bot Setup ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot;
if (token && chatId) {
    bot = new TelegramBot(token);
}

// --- Routes ---
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount, isPaid, paidAt, paymentResult } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // --- FIX: पहले प्रोडक्ट से वेंडर की ID निकालें ---
        const firstProductItem = await Product.findById(orderItems[0].product);
        if (!firstProductItem) {
            return res.status(404).json({ message: 'Product in cart not found in database.' });
        }
        const vendorId = firstProductItem.vendor;
        // --- FIX END ---

        const order = new Order({
            user: req.user._id,
            vendor: vendorId, // --- FIX: वेंडर ID को ऑर्डर में जोड़ें ---
            orderItems,
            shippingAddress,
            paymentMethod,
            totalAmount,
            isPaid: isPaid || false,
            paidAt: isPaid ? paidAt : null,
            paymentResult: paymentResult || {},
        });

        const createdOrder = await order.save();
        
        // --- Send Telegram Notification ---
        if (bot) {
            let telegramMessage = `🚨 *New Order Received!* 🚨\n-----------------------------------\n*Order ID:* \`${createdOrder._id}\`\n*Customer:* ${shippingAddress.fullName}\n*Phone:* ${shippingAddress.phone}\n*Total Amount:* ₹${totalAmount.toFixed(2)}\n*Payment Method:* ${paymentMethod}\n-----------------------------------\n*Items:*\n`;
            orderItems.forEach(item => {
                telegramMessage += `- ${item.name} (Qty: ${item.quantity})\n`;
            });
            telegramMessage += `-----------------------------------\n*Address:*\n${shippingAddress.address}, ${shippingAddress.area}, ${shippingAddress.city} - ${shippingAddress.pincode}`;
            bot.sendMessage(chatId, telegramMessage, { parse_mode: 'Markdown' });
        }
        // --- Notification End ---

        res.status(201).json(createdOrder);

    } catch (error) {
        console.error("Order Creation Error:", error); // सर्वर पर असली एरर देखने के लिए
        res.status(400).json({ message: 'Server Error: Could not place order.' });
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

module.exports = router;
