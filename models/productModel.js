const db = require('../config/db');

const Product = {
    // The required 15-item pagination query for the frontend
    getProductsPaginated: async (limit = 15, offset = 0) => {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             JOIN categories c ON p.category_id = c.category_id 
             WHERE p.is_visible = TRUE AND c.is_visible = TRUE 
             ORDER BY p.created_at DESC 
             LIMIT ? OFFSET ?`,
            [Number(limit), Number(offset)]
        );
        return rows;
    },

    // Get a single product by ID for the details page
    getProductById: async (productId) => {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             JOIN categories c ON p.category_id = c.category_id 
             WHERE p.product_id = ?`,
            [productId]
        );
        return rows[0];
    },

    // Storefront: get a product only if customers are allowed to see it
    // (product visible AND its category visible). Hidden items return undefined → 404.
    getStorefrontProductById: async (productId) => {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             JOIN categories c ON p.category_id = c.category_id 
             WHERE p.product_id = ? AND p.is_visible = TRUE AND c.is_visible = TRUE`,
            [productId]
        );
        return rows[0];
    },

    // Search bar functionality
    searchProducts: async (keyword) => {
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(
            `SELECT p.* FROM products p 
             JOIN categories c ON p.category_id = c.category_id 
             WHERE p.is_visible = TRUE AND c.is_visible = TRUE AND (
                 p.product_name LIKE ?
                 OR p.product_description LIKE ?
                 OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(p.product_attributes, '$.author'))) LIKE LOWER(?)
             )`,
            [searchTerm, searchTerm, searchTerm]
        );
        return rows;
    },

    // Filter by specific category
    getProductsByCategory: async (categoryId) => {
        const [rows] = await db.query(
            'SELECT * FROM products WHERE category_id = ? AND is_visible = TRUE',
            [categoryId]
        );
        return rows;
    },

    // Admin: Get all products with their categories, optionally filtered by category
    getAdminProducts: async (categoryId = null, searchKeyword = null) => {
        let query = `
            SELECT p.*, c.category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE 1=1
        `;
        const params = [];

        if (categoryId) {
            query += ` AND p.category_id = ?`;
            params.push(categoryId);
        }

        if (searchKeyword) {
            query += ` AND (p.product_name LIKE ? OR p.product_attributes LIKE ?)`;
            params.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows] = await db.query(query, params);
        return rows;
    },

    // Admin: Delete a product
    deleteProduct: async (productId) => {
        const [result] = await db.query('DELETE FROM products WHERE product_id = ?', [productId]);
        return result.affectedRows > 0;
    },

    // Admin: Add a new product
    addProduct: async (productData) => {
        const {
            category_id,
            product_name,
            product_description,
            product_price,
            product_images, // JSON string
            product_attributes, // JSON string
            product_quantity
        } = productData;

        const qty = parseInt(product_quantity) || 0;
        const isVisible = qty > 0;

        const [result] = await db.query(
            `INSERT INTO products 
             (category_id, product_name, product_description, product_price, product_images, product_attributes, product_quantity, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [category_id, product_name, product_description, product_price, product_images, product_attributes, qty, isVisible]
        );
        return result.insertId;
    },

    // Admin: Update a product
    updateProduct: async (productId, productData) => {
        const {
            category_id,
            product_name,
            product_description,
            product_price,
            product_images,
            product_attributes,
            product_quantity
        } = productData;

        const qty = parseInt(product_quantity) || 0;

        // Visibility follows stock:
        //  - new qty <= 0                     → hide automatically
        //  - old qty <= 0 and new qty > 0     → restocked, show again automatically
        //  - otherwise                        → keep what the admin chose (manual hide stays hidden)
        // NOTE: is_visible must be assigned BEFORE product_quantity — MySQL evaluates
        // SET left to right, so product_quantity here still holds the OLD value.
        const query = `UPDATE products 
                       SET is_visible = CASE
                               WHEN ? <= 0 THEN FALSE
                               WHEN product_quantity <= 0 THEN TRUE
                               ELSE is_visible
                           END,
                           category_id = ?, product_name = ?, product_description = ?, 
                           product_price = ?, product_images = ?, product_attributes = ?, product_quantity = ?
                       WHERE product_id = ?`;
        const params = [qty, category_id, product_name, product_description, product_price, product_images, product_attributes, qty, productId];

        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    },

    // Admin: Update product visibility
    updateVisibility: async (productId, isVisible) => {
        const [result] = await db.query(
            'UPDATE products SET is_visible = ? WHERE product_id = ?',
            [isVisible, productId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Product;