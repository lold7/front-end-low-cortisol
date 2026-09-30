// 1. Import Core Dependencies
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session'); // CRITICAL for your login and cart to work
const db = require('./config/db'); // Your database connection pool

// 2. Initialize the App
const app = express();

// 3. Session Configuration
// This enables req.session across all your controllers
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Keep false for local development; true if using HTTPS
}));

// 4. Application Setup (EJS & Views)
// Serving the EJS files your frontend team is working on

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// 5. General Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global template variables middleware
const User = require('./models/userModel');
const Cart = require('./models/cartModel');

app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.cartCount = 0;

    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                res.locals.user = user;
            }
            const cartItems = await Cart.getCartByUserId(req.session.userId);
            if (cartItems && cartItems.length > 0) {
                const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                res.locals.cartCount = count;
            }
        } catch (error) {
            console.error('Error fetching global template variables:', error);
        }
    }
    next();
});

// 6. Import Route Files & Custom Middleware
const webstoreRoutes = require('./routes/webstore');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const cartRoutes = require('./routes/cart');
const backofficeRoutes = require('./routes/backoffice');

const authCustomer = require('./middleware/authCustomer');
const authAdmin = require('./middleware/authAdmin');

// 7. Mount Routes & Protect Specific Paths
// We mount at '/' because your route files already include the full paths (e.g., '/login', '/cart')

// Public Routes
app.use('/', webstoreRoutes);
app.use('/', authRoutes);

// Protected Customer Routes
app.use('/account', authCustomer); // Protects /account and /account/orders/:id
app.use('/', accountRoutes);

app.use('/checkout', authCustomer); // Protects the checkout process
app.use('/', cartRoutes);

// Protected Admin Routes
app.use('/admin', authAdmin); // Protects the back-office dashboard
app.use('/backoffice', (req, res, next) => {
    // Allow login and register pages without auth
    if (req.path === '/login' || req.path === '/register') return next();
    return authAdmin(req, res, next);
});
app.use('/', backofficeRoutes);

// 8. 404 Error Handler
app.use((req, res) => {
    res.status(404).send('404: Page Not Found'); 
});

// 9. Start Server & Database Verification
const PORT = process.env.PORT || 3000;

// Great practice for DevOps: Verify the database is alive before booting the server
db.getConnection()
    .then((connection) => {
        console.log('✅ Successfully connected to the MySQL database.');
        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Bookstore server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to the MySQL database:', err.message);
        process.exit(1); // Kill the app if DB is unreachable
    });