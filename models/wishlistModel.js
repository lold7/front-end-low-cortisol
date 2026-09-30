const db = require('../config/db');

const Wishlist = {
    // Fetch all favorited books for a user
    getWishlistByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT w.wishlist_id, p.* FROM wishlist w
             JOIN products p ON w.product_id = p.product_id
             WHERE w.user_id = ?`,
            [userId]
        );
        return rows;
    },

    // Check if a specific book is in the user's wishlist
    isInWishlist: async (userId, productId) => {
        const [rows] = await db.query(
            'SELECT wishlist_id FROM wishlist WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return rows.length > 0;
    },

    // Add a book to the wishlist
    addItem: async (userId, productId) => {
        const [result] = await db.query(
            'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
            [userId, productId]
        );
        return result.insertId;
    },

    // Remove a book from the wishlist
    removeItem: async (productId, userId) => {
        const [result] = await db.query(
            'DELETE FROM wishlist WHERE product_id = ? AND user_id = ?',
            [productId, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Wishlist;