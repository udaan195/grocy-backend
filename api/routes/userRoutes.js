const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { protect } = require('../../middleware/authMiddleware');

// POST /api/users/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const user = new User({ name, email, password });
        const createdUser = await user.save();
        res.status(201).json({
            _id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role, // role भेजा जा रहा है
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role, // **यह लाइन सबसे ज़रूरी है**
                token: token,
                // address, city, etc., भी भेज सकते हैं
                address: user.address,
                city: user.city,
                pincode: user.pincode,
                state: user.state,
                phone: user.phone
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.address = req.body.address || user.address;
            user.city = req.body.city || user.city;
            user.pincode = req.body.pincode || user.pincode;
            user.phone = req.body.phone || user.phone;
            user.state = req.body.state || user.state;
            
            const updatedUser = await user.save();
            const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                token: token,
                address: updatedUser.address,
                city: updatedUser.city,
                pincode: updatedUser.pincode,
                state: updatedUser.state,
                phone: updatedUser.phone,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/users/profile
router.get('/profile', protect, (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            address: req.user.address,
            city: req.user.city,
            pincode: req.user.pincode,
            state: req.user.state,
            phone: req.user.phone,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:8080/login.html' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.redirect(`http://localhost:8080/auth-callback.html?token=${token}`);
    }
);


module.exports = router;
