const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const webstoreController = {
    // 1. Render the Homepage
    getHomePage: async (req, res) => {
        try {
            const categories = await Category.getVisibleCategories();
            // Fetch the newest 8 products to feature on the homepage
            const featuredProducts = await Product.getProductsPaginated(8, 0); 
            
            // Pass the data to your home.ejs file
            res.render('webstore/home', { 
                categories: categories, 
                products: featuredProducts 
            });
        } catch (error) {
            console.error('Error loading homepage:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // 2. Render All Products Page (Handles the 15-item pagination requirement)
    getAllProducts: async (req, res) => {
        try {
            // Check the URL for ?page=2, default to page 1 if not found
            const page = parseInt(req.query.page) || 1;
            const limit = 15; // Rubric requirement: 15 items per page
            const offset = (page - 1) * limit;

            const products = await Product.getProductsPaginated(limit, offset);
            const categories = await Category.getVisibleCategories();

            // Pass the data and current page number to your products.ejs file
            res.render('webstore/allProducts', { 
                products: products, 
                categories: categories, 
                currentPage: page 
            });
        } catch (error) {
            console.error('Error loading products page:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // 3. Render a Single Product's Detail Page
    getProductDetails: async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.getProductById(productId);

            if (!product) {
                return res.status(404).send('Book not found in the database.');
            }

            let isWishlisted = false;
            if (req.session && req.session.userId) {
                const Wishlist = require('../models/wishlistModel');
                isWishlisted = await Wishlist.isInWishlist(req.session.userId, productId);
            }

            // Pass the single product to your productDetail.ejs file
            res.render('webstore/productDetail', { 
                product: product,
                isWishlisted: isWishlisted
            });
        } catch (error) {
            console.error('Error loading product details:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // 4. Render Products filtered by Category
    getCategoryProducts: async (req, res) => {
        try {
            const categorySlug = req.params.id;
            const categories = await Category.getVisibleCategories();
            
            // Find the category matching the slug logic used in allCategories.ejs
            const targetCategory = categories.find(c => {
                const name = c.category_name;
                const map = {
                    'Fiction': 'fiction',
                    'Children': 'children',
                    'Non-Fiction': 'nonfiction',
                    'Mystery & Thriller': 'mystery',
                    'Science & Technology': 'science'
                };
                const expectedSlug = map[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return expectedSlug === categorySlug;
            });

            if (!targetCategory) {
                return res.status(404).send('Category not found');
            }

            const products = await Product.getProductsByCategory(targetCategory.category_id);

            // Renders to search-results.ejs (or whichever EJS file you intend for categories)
            res.render('webstore/search-results', { 
                products: products, 
                categories: categories,
                query: targetCategory.category_name
            });
        } catch (error) {
            console.error('Error loading category:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // 5. Render All Categories Page
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.getVisibleCategories();
            res.render('webstore/allCategories', { categories: categories });
        } catch (error) {
            console.error('Error loading all categories:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    // 6. Render Contact Page
    getContactPage: (req, res) => {
        res.render('webstore/contact');
    },

    // 7. Handle Search Queries
    searchProducts: async (req, res) => {
        try {
            const query = req.query.q || '';
            const limit = 15;
            const offset = parseInt(req.query.skip) || 0;
            
            // Assuming Product model has a search function, otherwise fallback to empty if generic not provided
            let products = [];
            if(Product.searchProducts) {
                 products = await Product.searchProducts(query, limit, offset);
            } else {
                 // Temporary fallback, you might need a proper search in your DB
                 products = await Product.getProductsPaginated(15, 0); 
            }
            
            const categories = await Category.getVisibleCategories();

            res.render('webstore/search-results', { 
                products: products, 
                categories: categories,
                query: query
            });
        } catch (error) {
            console.error('Error searching products:', error);
            res.status(500).send('Internal Server Error');
        }
    }

};

module.exports = webstoreController;
