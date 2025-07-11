const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const { protect } = require('../../middleware/authMiddleware');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot;
if (token && chatId) {
    bot = new TelegramBot(token);
}

router.post('/', protect, async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount } = req.body;
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }
        const order = new Order({
            user: req.user._id,
            orderItems, shippingAddress, paymentMethod, totalAmount,
        });
        const createdOrder = await order.save();

        if (bot) {
            let telegramMessage = `🚨 *New Order!* 🚨\nID: \`${createdOrder._id}\`\nCustomer: ${shippingAddress.fullName}\nTotal: ₹${totalAmount.toFixed(2)}`;
            bot.sendMessage(chatId, telegramMessage, { parse_mode: 'Markdown' });
        }
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(400).json({ message: error.message || 'Could not place order.' });
    }
});

module.exports = router;
