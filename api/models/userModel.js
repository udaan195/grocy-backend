const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // OTP login ke liye optional
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'vendor', 'admin'],
        default: 'customer'
    },
    telegramChatId: {
        type: String,
    },
    phone: {
        type: String,
        // required: true, // Ise baad me anivarya karenge
        // unique: true,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        next();
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
