const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendor: { // <-- यह नई फ़ील्ड जोड़ें
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
// ...
    unit: { type: String },
    description: { type: String }, // <-- यह नई लाइन जोड़ें
    maxBuyQuantity: { type: Number },
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
