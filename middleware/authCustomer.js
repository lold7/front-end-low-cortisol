const authCustomer = (req, res, next) => {
    // Check if the user is logged in
    if (req.session && req.session.userId) {
        return next(); // They are logged in, let them proceed to the cart/account
    }
    
    // AJAX/JSON requests (e.g. wishlist toggle) can't follow a redirect meaningfully,
    // so answer with 401 + where to go and let the client navigate to the login page
    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Please log in first', redirect: '/auth/login' });
    }

    // Not logged in? Redirect to login page
    res.redirect('/auth/login');
};

module.exports = authCustomer;