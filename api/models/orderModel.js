// backend/api/models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // ... user, orderItems, shippingAddress, etc. fields ...
    paymentMethod: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    // --- यह नया फील्ड है ---
    status: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },
    deliveredAt: { type: Date },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
