const db = require('../config/db');

const Cart = {
    // Get all items in a specific user's cart
    getCartByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT c.cart_item_id, c.quantity, p.product_id, p.product_name, p.product_price, p.product_images
             FROM cart_items c
             JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = ?`,
            [userId]
        );
        return rows;
    },

    // Add a product to the cart (or update quantity if it already exists)
    addItem: async (userId, productId, quantity = 1) => {
        const [existing] = await db.query(
            'SELECT cart_item_id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existing.length > 0) {
            // Update existing quantity
            const newQty = existing[0].quantity + quantity;
            await db.query('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [newQty, existing[0].cart_item_id]);
            return existing[0].cart_item_id;
        } else {
            // Insert new cart item
            const [result] = await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity]
            );
            return result.insertId;
        }
    },

    // Update the quantity of a specific cart item
    updateItemQuantity: async (cartItemId, userId, quantity) => {
        const [result] = await db.query(
            'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND user_id = ?',
            [quantity, cartItemId, userId]
        );
        return result.affectedRows > 0;
    },

    // Remove a single item from the cart
    removeItem: async (cartItemId, userId) => {
        const [result] = await db.query(
            'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?', 
            [cartItemId, userId]
        );
        return result.affectedRows > 0;
    },

    // Clear the entire cart (used after a successful checkout)
    clearCart: async (userId) => {
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    }
};

module.exports = Cart;