// backend/api/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const { protect, admin, vendor } = require('../../middleware/authMiddleware');

// ... आपका POST /api/orders वाला रूट यहाँ रहेगा ...

// @desc    Update order status (e.g., to Shipped, Delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor/Admin
router.put('/:id/status', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // जांचें कि यूज़र एडमिन है या इस ऑर्डर का वेंडर है
        const isVendorOfThisOrder = order.orderItems.some(item => item.vendor.equals(req.user._id));
        if (req.user.role !== 'admin' && !isVendorOfThisOrder) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
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

// @desc    Cancel an order
// @route   DELETE /api/orders/:id
// @access  Private/Vendor/Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if(!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isVendorOfThisOrder = order.orderItems.some(item => item.vendor.equals(req.user._id));
        if (req.user.role !== 'admin' && !isVendorOfThisOrder) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // हम ऑर्डर को डिलीट नहीं करेंगे, सिर्फ उसका स्टेटस बदलेंगे
        order.status = 'Cancelled';
        await order.save();
        res.json({ message: 'Order has been cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// ... आपके बाकी के GET order routes यहाँ रहेंगे ...

module.exports = router;
