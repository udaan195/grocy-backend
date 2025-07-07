const jwt = require('jsonwebtoken');
const User = require('../api/models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 'Bearer' शब्द हटाकर टोकन निकालें
            token = req.headers.authorization.split(' ')[1];
            
            // टोकन को वेरिफाई करें
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // यूजर की जानकारी निकालें (बिना पासवर्ड के)
            req.user = await User.findById(decoded.id).select('-password');
            
            next(); // अगले मिडिलवेयर या रूट पर जाएँ
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
