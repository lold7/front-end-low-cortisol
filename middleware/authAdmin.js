const authAdmin = (req, res, next) => {
    // Check if the user is logged in AND has the admin role
    if (req.session && req.session.userId && req.session.role === 'admin') {
        return next(); // They are the admin, let them into the backoffice
    }
    
    // If they are a regular customer (or not logged in), block access
    res.status(403).send('Access Denied: Admins Only');
};

module.exports = authAdmin;