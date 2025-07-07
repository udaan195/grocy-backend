const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../api/models/userModel');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/users/auth/google/callback',
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
                        const newUser = new User({
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            password: Math.random().toString(36).slice(-8), // एक रैंडम पासवर्ड
                        });
                        await newUser.save({ validateBeforeSave: false }); // पासवर्ड हैशिंग को बायपास करें
                        return done(null, newUser);
                    }
                } catch (err) {
                    console.error(err);
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
