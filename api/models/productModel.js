// backend/api/models/productModel.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true }, // विवरण जोड़ा गया
    category: { type: String, required: true },
    image: { type: String, required: true },
    unit: { type: String, required: true }, // अब यह ज़रूरी है
    pcsCount: { type: Number }, // सिर्फ pcs के लिए
    stock: { type: Number, required: true, default: 0 }, // स्टॉक जोड़ा गया
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
