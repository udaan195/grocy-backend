const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');
require('dotenv').config();

// Passport Config
require('./config/passport')(passport);

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors({ origin: 'https://grocyapp.netlify.app' })); // आपके frontend का URL
app.use(passport.initialize()); // सिर्फ passport.initialize() रहेगा

// Root Route
app.get('/', (req, res) => res.send('Grocery App Backend is Running!'));

// API Routes
app.use('/api/products', require('./api/routes/productRoutes'));
app.use('/api/orders', require('./api/routes/orderRoutes'));
app.use('/api/users', require('./api/routes/userRoutes'));
app.use('/api/payment', require('./api/routes/paymentRoutes'));
app.use('/api/dashboard', require('./api/routes/dashboardRoutes'));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
