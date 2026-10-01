const db = require('../config/db');

const Category = {
    // For the public webstore (only shows active categories)
    getVisibleCategories: async () => {
        const [rows] = await db.query('SELECT * FROM categories WHERE is_visible = TRUE');
        return rows;
    },

    // For the back-office (shows everything)
    getAllCategories: async () => {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    },

    // Admin: Toggle visibility
    updateVisibility: async (categoryId, isVisible) => {
        const [result] = await db.query(
            'UPDATE categories SET is_visible = ? WHERE category_id = ?',
            [isVisible, categoryId]
        );
        return result.affectedRows > 0;
    },

    // Get categories with product counts for Admin display
    getAdminCategories: async () => {
        const [rows] = await db.query(`
            SELECT c.*, COUNT(p.product_id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id
            GROUP BY c.category_id
            ORDER BY c.category_name ASC
        `);
        return rows;
    },

    // Admin: Add a new category
    addCategory: async (categoryName, categoryImage) => {
        const [result] = await db.query(
            'INSERT INTO categories (category_name, category_image, is_visible) VALUES (?, ?, TRUE)',
            [categoryName, categoryImage || null]
        );
        return result.insertId;
    },

    // Admin: Edit an existing category
    editCategory: async (categoryId, categoryName, categoryImage) => {
        const [result] = await db.query(
            'UPDATE categories SET category_name = ?, category_image = ? WHERE category_id = ?',
            [categoryName, categoryImage || null, categoryId]
        );
        return result.affectedRows > 0;
    },

    // Admin: Count products in a category (used to block deleting non-empty categories)
    countProducts: async (categoryId) => {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?',
            [categoryId]
        );
        return Number(rows[0].cnt);
    },

    // Admin: Delete a category (caller must make sure it has no products first)
    deleteCategory: async (categoryId) => {
        const [result] = await db.query(
            'DELETE FROM categories WHERE category_id = ?',
            [categoryId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Category;