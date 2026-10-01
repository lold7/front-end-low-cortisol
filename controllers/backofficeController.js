const bcrypt = require('bcryptjs');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Admin = require('../models/adminModel');

const backofficeController = {
    // Render the admin login page
    getLoginPage: (req, res) => {
        res.render('backoffice/login', { error: null });
    },

    // Process admin login
    loginAdmin: async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await User.findByEmail(email);

            if (user && user.role === 'admin' && await bcrypt.compare(password, user.password_hash)) {
                req.session.userId = user.user_id;
                req.session.role = user.role;
                return res.redirect('/admin');
            }
            res.render('backoffice/login', { error: 'Invalid admin credentials' });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render the admin register page
    getRegisterPage: (req, res) => {
        res.render('backoffice/register', { error: null });
    },

    // Process admin registration
    registerAdmin: async (req, res) => {
        const { username, email, phone, password, confirm_password } = req.body;
        
        if (password !== confirm_password) {
            return res.render('backoffice/register', { error: 'Passwords do not match' });
        }

        try {
            // Check if email already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.render('backoffice/register', { error: 'Email already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await User.createAdmin(username, email, hashedPassword, phone);

            // Redirect to login upon successful creation
            res.redirect('/backoffice/login');
        } catch (error) {
            console.error('Admin registration error:', error);
            res.render('backoffice/register', { error: 'Failed to create admin account' });
        }
    },

    // Render the main admin dashboard
    getDashboard: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            // Fetch overview statistics for the template layout KPIs (now paginated for recent orders)
            const stats = await Admin.getDashboardStats(limit, offset);
            
            const totalPages = Math.ceil(stats.totalOrders / limit);

            // Fetch up to 100 products for the (optional/future) admin table
            const products = await Product.getProductsPaginated(100, 0); 
            
            res.render('backoffice/dashboard', { 
                stats: stats,
                products: products,
                currentPage: page,
                totalPages: totalPages
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render the inventory page for adding/editing a product
    getInventoryPage: async (req, res) => {
        try {
            const categories = await Category.getAdminCategories();
            res.render('backoffice/inventory', { categories: categories, product: null });
        } catch (error) {
            console.error('Inventory page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render the inventory page for EDITING a product
    getEditInventoryPage: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.getProductById(productId);
            const categories = await Category.getAdminCategories();
            
            if (!product) {
                return res.redirect('/backoffice/products');
            }
            
            res.render('backoffice/inventory', { categories: categories, product: product });
        } catch (error) {
            console.error('Edit inventory page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render Category Management page
    getCategoriesPage: async (req, res) => {
        try {
            const categories = await Category.getAdminCategories();
            res.render('backoffice/categories', { categories: categories });
        } catch (error) {
            console.error('Categories page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render the orders page
    getOrdersPage: async (req, res) => {
        try {
            const statusFilter = req.query.status || '';
            const searchQuery = req.query.search || '';
            const orders = await Order.getAllOrders(statusFilter, searchQuery);
            res.render('backoffice/orders', { 
                orders: orders, 
                statusFilter: statusFilter,
                searchQuery: searchQuery 
            });
        } catch (error) {
            console.error('Orders page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Add a new category
    addCategory: async (req, res) => {
        try {
            const { category_name, category_image } = req.body;
            await Category.addCategory(category_name, category_image);
            res.redirect('/backoffice/categories');
        } catch (error) {
            console.error('Add category error:', error);
            res.redirect('/backoffice/categories');
        }
    },

    // Edit an existing category
    editCategory: async (req, res) => {
        try {
            const categoryId = req.params.id;
            const { category_name, category_image } = req.body;
            await Category.editCategory(categoryId, category_name, category_image);
            res.redirect('/backoffice/categories');
        } catch (error) {
            console.error('Edit category error:', error);
            res.redirect('/backoffice/categories');
        }
    },

    // Toggle category visibility
    toggleCategoryStatus: async (req, res) => {
        try {
            const categoryId = req.params.id;
            const categories = await Category.getAdminCategories();
            const category = categories.find(c => c.category_id == categoryId);
            
            if (category) {
                await Category.updateVisibility(categoryId, !category.is_visible);
            }
            res.redirect('/backoffice/categories');
        } catch (error) {
            console.error('Toggle category error:', error);
            res.redirect('/backoffice/categories');
        }
    },

    // Delete a category
    deleteCategory: async (req, res) => {
        try {
            const categoryId = req.params.id;

            // Block deleting a category that still has products (prevents FK cascade wiping them)
            const productCount = await Category.countProducts(categoryId);
            if (productCount > 0) {
                const categories = await Category.getAdminCategories();
                return res.status(409).render('backoffice/categories', {
                    categories: categories,
                    error: `Cannot delete a category that contains products (${productCount} product${productCount === 1 ? '' : 's'}). Please delete or reassign the products first.`
                });
            }

            await Category.deleteCategory(categoryId);
            res.redirect('/backoffice/categories');
        } catch (error) {
            console.error('Delete category error:', error);
            const categories = await Category.getAdminCategories();
            res.status(500).render('backoffice/categories', { 
                categories: categories, 
                error: 'Could not delete this category. Please try again.' 
            });
        }
    },

    // Render Product Management page
    getProductsPage: async (req, res) => {
        try {
            const selectedCategory = req.query.category || null;
            const searchKeyword = req.query.search || null;
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            // Fetch all categories for the filter dropdown
            const categories = await Category.getAdminCategories();
            // Fetch all products, optionally filtered by the dropdown selection and search
            const allProducts = await Product.getAdminProducts(selectedCategory, searchKeyword);

            // Calculate pagination variables
            const totalProducts = allProducts.length;
            const totalPages = Math.ceil(totalProducts / limit);
            const products = allProducts.slice(offset, offset + limit);

            res.render('backoffice/products', {
                categories: categories,
                products: products,
                selectedCategory: selectedCategory,
                searchKeyword: searchKeyword,
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                error: null
            });
        } catch (error) {
            console.error('Products page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).send('Invalid order status');
            }
            await Order.updateOrderStatus(id, status);
            res.redirect('/backoffice/orders');
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Fetch order details for admin modal
    getOrderDetailsApi: async (req, res) => {
        try {
            const { id } = req.params;
            const details = await Order.getAdminOrderDetails(id);
            res.json({ success: true, details: details });
        } catch (error) {
            console.error('API get order details error:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    },

    // Render the customers page
    getCustomersPage: async (req, res) => {
        try {
            const searchQuery = req.query.search || '';
            const customers = await User.getAllCustomers(searchQuery);
            res.render('backoffice/customers', { customers: customers, searchQuery: searchQuery });
        } catch (error) {
            console.error('Customers page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Toggle product visibility
    toggleProductStatus: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.getProductById(productId);
            
            if (product) {
                await Product.updateVisibility(productId, !product.is_visible);
            }
            res.redirect('/backoffice/products');
        } catch (error) {
            console.error('Toggle product error:', error);
            res.redirect('/backoffice/products');
        }
    },

    // Delete a product
    deleteProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            await Product.deleteProduct(productId);
            res.redirect('/backoffice/products');
        } catch (error) {
            console.error('Delete product error:', error);
            
            // Re-render product page with an error if foreign key constraints block deletion (e.g. order history)
            const selectedCategory = req.query.category || null;
            const searchKeyword = req.query.search || null;
            const categories = await Category.getAdminCategories();
            const products = await Product.getAdminProducts(selectedCategory, searchKeyword);

            res.render('backoffice/products', {
                categories: categories,
                products: products.slice(0, 10), // Fallback to first page
                selectedCategory: selectedCategory,
                searchKeyword: searchKeyword,
                currentPage: 1,
                totalPages: Math.ceil(products.length / 10),
                totalProducts: products.length,
                error: 'Cannot delete a product that has existing customer order records. Please edit the product to hide it instead.'
            });
        }
    },

    // Add a new product
    addProduct: async (req, res) => {
        try {
            const {
                product_name,
                category_id,
                product_description,
                product_price,
                product_quantity,
                author,
                format
            } = req.body;

            // Build attributes JSON
            let formatArray = [];
            if (req.body.format) {
                formatArray = Array.isArray(req.body.format) ? req.body.format : [req.body.format];
            } else if (req.body['format[]']) {
                formatArray = Array.isArray(req.body['format[]']) ? req.body['format[]'] : [req.body['format[]']];
            }

            const product_attributes = JSON.stringify({
                author: author || '',
                format: formatArray
            });

            // Process uploaded images
            let uploadedImages = [];
            if (req.files && req.files.length > 0) {
                uploadedImages = req.files.map(file => file.filename);
            }
            const product_images = JSON.stringify(uploadedImages);

            await Product.addProduct({
                category_id,
                product_name,
                product_description,
                product_price,
                product_quantity,
                product_images,
                product_attributes
            });
            
            res.redirect('/backoffice/products');
        } catch (error) {
            console.error('Add product error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Edit a product
    editProduct: async (req, res) => {
        try {
            const productId = req.params.id;
            const {
                product_name,
                category_id,
                product_description,
                product_price,
                product_quantity,
                author,
                format
            } = req.body;

            let formatArray = [];
            if (req.body.format) {
                formatArray = Array.isArray(req.body.format) ? req.body.format : [req.body.format];
            } else if (req.body['format[]']) {
                formatArray = Array.isArray(req.body['format[]']) ? req.body['format[]'] : [req.body['format[]']];
            }

            const product_attributes = JSON.stringify({
                author: author || '',
                format: formatArray
            });

            // For updates, we fetch the old product to keep old images if no new ones provided
            const existingProduct = await Product.getProductById(productId);
            
            let uploadedImages = [];
            if (req.files && req.files.length > 0) {
                uploadedImages = req.files.map(file => file.filename);
            } else {
                // Keep the old images if not overwritten
                try {
                    uploadedImages = JSON.parse(existingProduct.product_images || '[]');
                } catch (e) {
                    uploadedImages = [existingProduct.product_images];
                }
            }
            
            const product_images = JSON.stringify(uploadedImages);

            await Product.updateProduct(productId, {
                category_id,
                product_name,
                product_description,
                product_price,
                product_quantity,
                product_images,
                product_attributes
            });
            
            res.redirect('/backoffice/products');
        } catch (error) {
            console.error('Edit product error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Admin Profile Page
    getAdminProfile: async (req, res) => {
        try {
            const adminData = await User.findById(req.session.userId);
            res.render('backoffice/adminProfile', { admin: adminData, error: null, success: null });
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            res.redirect('/admin');
        }
    },

    // Update Admin Profile Attributes
    updateAdminProfile: async (req, res) => {
        try {
            const { username, email, phone } = req.body;
            await User.updateUserProfile(req.session.userId, username, email, phone);
            const adminData = await User.findById(req.session.userId);
            res.render('backoffice/adminProfile', { admin: adminData, success: 'Profile updated successfully!', error: null });
        } catch (error) {
            console.error('Error updating admin profile:', error);
            const adminData = await User.findById(req.session.userId);
            res.render('backoffice/adminProfile', { admin: adminData, success: null, error: 'Failed to update profile. Database error.' });
        }
    },

    // Update Admin Password
    updateAdminPassword: async (req, res) => {
        try {
            const { current_password, new_password, confirm_password } = req.body;
            const adminData = await User.findById(req.session.userId);
            
            if (new_password !== confirm_password) {
                return res.render('backoffice/adminProfile', { admin: adminData, error: 'New passwords do not match.', success: null });
            }
            
            const currentHash = await User.findPasswordHashById(req.session.userId);
            const isMatch = await bcrypt.compare(current_password, currentHash);
            if (!isMatch) {
                return res.render('backoffice/adminProfile', { admin: adminData, error: 'Incorrect current password.', success: null });
            }
            
            const newHash = await bcrypt.hash(new_password, 10);
            await User.updateUserPassword(req.session.userId, newHash);
            res.render('backoffice/adminProfile', { admin: adminData, success: 'Password changed successfully!', error: null });
        } catch (error) {
            console.error('Error updating admin password:', error);
            const adminData = await User.findById(req.session.userId);
            res.render('backoffice/adminProfile', { admin: adminData, error: 'Server error updating password.', success: null });
        }
    }
};

module.exports = backofficeController;