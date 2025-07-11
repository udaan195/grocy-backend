const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../api/models/userModel');

module.exports = function(passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        return done(null, user);
                    } else {
                        const newUser = new User({
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            password: Math.random().toString(36).slice(-8),
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
