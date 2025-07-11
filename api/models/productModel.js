// backend/api/models/productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    unit: { type: String },
    minBuyQuantity: { type: Number, default: 1 },
    maxBuyQuantity: { type: Number },
    // --- यह सबसे ज़रूरी बदलाव है ---
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // इसका मतलब है कि यह User मॉडल से जुड़ा है
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
