const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next(); // अगर यूजर है और एडमिन है, तो आगे बढ़ो
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // 403 - Forbidden
    }
};

module.exports = { admin };
