// backend/config/passport.js

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../api/models/userModel');
const bcrypt = require('bcryptjs'); // पासवर्ड के लिए यह ज़रूरी है

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/users/auth/google/callback', // यह पूरा URL होना चाहिए, जैसे https://your-backend.com/api/users/auth/google/callback
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // जांचें कि क्या यूजर हमारे डेटाबेस में पहले से मौजूद है
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // अगर यूजर है, तो उसे लॉग-इन करें
                        return done(null, user);
                    } else {
                        // अगर यूजर नहीं है, तो नया यूजर बनाएँ
                        const salt = await bcrypt.genSalt(10);
                        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), salt); // एक रैंडम पासवर्ड को हैश करें

                        const newUser = new User({
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            password: hashedPassword, // हैश किया हुआ पासवर्ड सेव करें
                        });
                        await newUser.save();
                        return done(null, newUser);
                    }
                } catch (err) {
                    console.error(err);
                    return done(err, null);
                }
            }
        )
    );
};

// serializeUser और deserializeUser को यहाँ से पूरी तरह हटा दिया गया है।
