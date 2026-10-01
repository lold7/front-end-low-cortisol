const db = require('../config/db');

const Cart = {
    // Get all items in a specific user's cart
    getCartByUserId: async (userId) => {
        const [rows] = await db.query(
            `SELECT c.cart_item_id, c.quantity, c.selected_attributes, p.product_id, p.product_name, p.product_price, p.product_images
             FROM cart_items c
             JOIN products p ON c.product_id = p.product_id
             WHERE c.user_id = ?`,
            [userId]
        );
        return rows;
    },

    // How many units of a product this user already has in the cart (all formats combined)
    getItemQuantity: async (userId, productId) => {
        const [rows] = await db.query(
            'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return parseInt(rows[0].total) || 0;
    },

    // Add a product to the cart (or update quantity if the same book + same format already exists)
    addItem: async (userId, productId, quantity = 1, selectedAttributes = null) => {
        const format = selectedAttributes && selectedAttributes.format ? selectedAttributes.format : null;
        const [existing] = await db.query(
            `SELECT cart_item_id, quantity FROM cart_items
             WHERE user_id = ? AND product_id = ?
               AND JSON_UNQUOTE(JSON_EXTRACT(selected_attributes, '$.format')) <=> ?`,
            [userId, productId, format]
        );

        if (existing.length > 0) {
            // Update existing quantity
            const newQty = existing[0].quantity + quantity;
            await db.query('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [newQty, existing[0].cart_item_id]);
            return existing[0].cart_item_id;
        } else {
            // Insert new cart item
            const [result] = await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity, selected_attributes) VALUES (?, ?, ?, ?)',
                [userId, productId, quantity, selectedAttributes ? JSON.stringify(selectedAttributes) : null]
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