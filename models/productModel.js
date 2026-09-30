const db = require('../config/db');

const Product = {
    // The required 15-item pagination query for the frontend
    getProductsPaginated: async (limit = 15, offset = 0) => {
        const [rows] = await db.query(
            `SELECT p.*, c.category_name 
             FROM products p 
             JOIN categories c ON p.category_id = c.category_id 
             WHERE p.is_visible = TRUE 
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

    // Search bar functionality
    searchProducts: async (keyword) => {
        const searchTerm = `%${keyword}%`;
        const [rows] = await db.query(
            `SELECT * FROM products 
             WHERE is_visible = TRUE AND (product_name LIKE ? OR product_description LIKE ?)`,
            [searchTerm, searchTerm]
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

        let query = `UPDATE products 
                     SET category_id = ?, product_name = ?, product_description = ?, 
                         product_price = ?, product_images = ?, product_attributes = ?, product_quantity = ?`;
        let params = [category_id, product_name, product_description, product_price, product_images, product_attributes, qty];

        if (qty <= 0) {
            query += `, is_visible = FALSE`;
        }

        query += ` WHERE product_id = ?`;
        params.push(productId);

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