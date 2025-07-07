// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Base Route
app.get('/', (req, res) => res.send('Grocery App Backend is Running!'));

// Import and Use API Routes
app.use('/api/products', require('./api/routes/productRoutes'));
app.use('/api/orders', require('./api/routes/orderRoutes'));
app.use('/api/users', require('./api/routes/userRoutes'));
app.use('/api/payment', require('./api/routes/paymentRoutes'));
app.use('/api/dashboard', require('./api/routes/dashboardRoutes'));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));