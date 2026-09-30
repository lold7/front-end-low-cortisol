const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// View the basket
router.get('/cart', cartController.viewCart);

// Add an item (Usually submitted via a hidden form on the product detail page)
router.post('/cart/add', cartController.addToCart);

// Update an item quantity
router.post('/cart/update', cartController.updateCart);

// Remove an item
router.post('/cart/remove', cartController.removeFromCart);

// Render the checkout page
router.get('/checkout', cartController.getCheckoutPage);

// Render the choose payment page
router.get('/choosePayment', cartController.getChoosePaymentPage);

// Payment Method Management
router.post('/choosePayment/add', cartController.addPaymentMethod);
router.post('/choosePayment/delete/:id', cartController.deletePaymentMethod);
router.post('/choosePayment/default/:id', cartController.setDefaultPaymentMethod);

// Process the final order
router.post('/checkout', cartController.checkout);

module.exports = router;