const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../../middleware/authMiddleware');

// GET /api/payment/getkey - Razorpay की Key ID भेजने के लिए
router.get('/getkey', (req, res) => {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

// POST /api/payment/orders - पेमेंट ऑर्डर बनाने के लिए
router.post('/orders', protect, async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(req.body.amount * 100), // Ensure amount is an integer
            currency: 'INR',
            receipt: crypto.randomBytes(10).toString('hex'),
        };

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.error("Razorpay order creation error:", error);
                return res.status(500).json({ message: 'Something Went Wrong!' });
            }
            res.status(200).json({ data: order });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error!' });
    }
});

// POST /api/payment/verify - पेमेंट को वेरिफाई करने के लिए
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid signature sent!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error!' });
    }
});

module.exports = router;
