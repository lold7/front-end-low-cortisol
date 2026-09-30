const express = require('express');
const router = express.Router();
const backofficeController = require('../controllers/backofficeController');
const multer = require('multer');
const path = require('path');

// Configure Multer storage for product images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images/products'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Admin login page
router.get('/backoffice/login', backofficeController.getLoginPage);
router.post('/backoffice/login', backofficeController.loginAdmin);

// Admin register page
router.get('/backoffice/register', backofficeController.getRegisterPage);
router.post('/backoffice/register', backofficeController.registerAdmin);

// The main admin dashboard
router.get('/admin', backofficeController.getDashboard);

// Inventory page (add/edit product)
router.get('/backoffice/inventory', backofficeController.getInventoryPage);
router.get('/backoffice/inventory/:id', backofficeController.getEditInventoryPage);
router.post('/backoffice/inventory/add', upload.array('product_images', 5), backofficeController.addProduct);
router.post('/backoffice/inventory/edit/:id', upload.array('product_images', 5), backofficeController.editProduct);

// Orders page
router.get('/backoffice/orders', backofficeController.getOrdersPage);
router.post('/backoffice/orders/status/:id', backofficeController.updateOrderStatus);
router.get('/backoffice/orders/api/:id', backofficeController.getOrderDetailsApi);

// Customers page
router.get('/backoffice/customers', backofficeController.getCustomersPage);
// Category Management
router.get('/backoffice/categories', backofficeController.getCategoriesPage);
router.post('/backoffice/categories/add', backofficeController.addCategory);
router.post('/backoffice/categories/edit/:id', backofficeController.editCategory);
router.post('/backoffice/categories/toggle/:id', backofficeController.toggleCategoryStatus);
router.post('/backoffice/categories/delete/:id', backofficeController.deleteCategory);

// Product Management
router.get('/backoffice/products', backofficeController.getProductsPage);
router.post('/backoffice/products/toggle/:id', backofficeController.toggleProductStatus);
router.post('/backoffice/products/delete/:id', backofficeController.deleteProduct);

// Admin Profile
router.get('/backoffice/profile', backofficeController.getAdminProfile);
router.post('/backoffice/profile', backofficeController.updateAdminProfile);
router.post('/backoffice/profile/password', backofficeController.updateAdminPassword);

module.exports = router;