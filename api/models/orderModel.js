const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [{
        name: { type: String, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        productId: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product' 
        }
    }],
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        state: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: { 
        type: String, 
        required: true 
    },
    status: {
        type: String,
        required: true,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing',
    },
    totalAmount: { 
        type: Number, 
        required: true 
    },
    isPaid: { 
        type: Boolean, 
        default: false 
    },
    paidAt: { 
        type: Date 
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    }
}, {
    timestamps: true 
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
