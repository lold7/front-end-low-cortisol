const authCustomer = (req, res, next) => {
    // Check if the user is logged in
    if (req.session && req.session.userId) {
        return next(); // They are logged in, let them proceed to the cart/account
    }
    
    // Not logged in? Redirect to login page
    res.redirect('/auth/login');
};

module.exports = authCustomer;