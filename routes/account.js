const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// Redirect /account to /account/profile for consistency
router.get('/account', (req, res) => res.redirect('/account/profile'));

// View the main account dashboard (Profile)
router.get('/account/profile', accountController.getProfilePage);
router.post('/account/profile', accountController.updateProfile);
router.post('/account/password', accountController.updatePassword);

// View the order history list
router.get('/account/orders', accountController.getOrdersPage);

// View the details of a specific past order
router.get('/account/orders/:id', accountController.getOrderDetails);

// View the wishlist
router.get('/account/wishlist', accountController.getWishlistPage);

// Toggle an item in the wishlist via AJAX
router.post('/account/wishlist/toggle', accountController.toggleWishlist);

// View the address book
router.get('/account/addresses', accountController.getAddressBookPage);

// Address Management
router.post('/account/addresses/add', accountController.addAddress);
router.post('/account/addresses/delete/:id', accountController.deleteAddress);
router.post('/account/addresses/default/:id', accountController.setDefaultAddress);

// Payment Methods Management
router.get('/account/payment-methods', accountController.getPaymentMethodsPage);
router.post('/account/payment-methods/add', accountController.addPaymentMethod);
router.post('/account/payment-methods/delete/:id', accountController.deletePaymentMethod);
router.post('/account/payment-methods/default/:id', accountController.setDefaultPaymentMethod);

module.exports = router;