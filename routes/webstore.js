const express = require('express');
const router = express.Router();
const webstoreController = require('../controllers/webstoreController');

// When a user visits '/', run the getHomePage function
router.get('/', webstoreController.getHomePage);

// When a user visits '/products', run the getAllProducts function (handles the 15-item limit)
router.get('/products', webstoreController.getAllProducts);

// The ':id' is a dynamic parameter. It catches URLs like '/product/5'
router.get('/product/:id', webstoreController.getProductDetails);

router.get('/category/:id', webstoreController.getCategoryProducts);

// Route for All Categories page
router.get('/categories', webstoreController.getAllCategories);
router.get('/contact', webstoreController.getContactPage);
router.get('/search', webstoreController.searchProducts);

module.exports = router;