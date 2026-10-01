const db = require('../config/db');

const Order = {
    // Process a checkout (single transaction: order + items + stock + clear cart)
    createOrder: async (userId, addressId, totalPrice, paymentMethod, cartItems) => {
        // Determine status based on payment method
        const orderStatus = paymentMethod === 'Cash on Delivery' ? 'pending' : 'completed';

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create the main order record
            const [orderResult] = await conn.query(
                'INSERT INTO orders (user_id, address_id, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?)',
                [userId, addressId, totalPrice, paymentMethod, orderStatus]
            );
            const orderId = orderResult.insertId;

            for (const item of cartItems) {
                // 2. Deduct stock (only succeeds if enough stock is left)
                const [upd] = await conn.query(
                    'UPDATE products SET product_quantity = product_quantity - ? WHERE product_id = ? AND product_quantity >= ?',
                    [item.quantity, item.product_id, item.quantity]
                );
                if (upd.affectedRows === 0) {
                    const err = new Error(`Sorry, "${item.product_name}" does not have enough stock left.`);
                    err.code = 'OUT_OF_STOCK';
                    throw err;
                }

                // 3. Move the item from the cart into the order_items table
                await conn.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, selected_attributes) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.product_price,
                     item.selected_attributes ? (typeof item.selected_attributes === 'string' ? item.selected_attributes : JSON.stringify(item.selected_attributes)) : null]
                );
            }

            // 4. Empty the user's cart
            await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

            await conn.commit();
            return orderId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    // Get order history for the "My Account" page
    getOrderHistory: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', 
            [userId]
        );
        return rows;
    },

    // Get a single order header, only if it belongs to this user
    getOrderById: async (orderId, userId) => {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
            [orderId, userId]
        );
        return rows[0] || null;
    },

    getOrderDetails: async (orderId, userId) => {
        const [rows] = await db.query(
            `SELECT oi.*, p.product_name, p.product_images
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             JOIN orders o ON oi.order_id = o.order_id
             WHERE oi.order_id = ? AND o.user_id = ?`,
            [orderId, userId]
        );
        return rows;
    },

    // Admin: Get details of an order
    getAdminOrderDetails: async (orderId) => {
        const [rows] = await db.query(
            `SELECT oi.*, p.product_name, p.product_images
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );
        return rows;
    },

    // Admin: Get all orders, optionally filtered by status and search query
    getAllOrders: async (statusFilter, searchQuery = '') => {
        let query = `
            SELECT o.*, u.username 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.user_id
            WHERE 1=1
        `;
        let params = [];
        
        if (statusFilter) {
            query += ` AND o.status = ?`;
            params.push(statusFilter);
        }
        
        if (searchQuery) {
            const isNumeric = !isNaN(searchQuery) && searchQuery.trim() !== '';
            if (isNumeric) {
                query += ` AND (o.order_id = ? OR u.username LIKE ?)`;
                params.push(searchQuery, '%' + searchQuery + '%');
            } else {
                query += ` AND u.username LIKE ?`;
                params.push('%' + searchQuery + '%');
            }
        }
        
        query += ` ORDER BY o.created_at DESC`;
        
        const [rows] = await db.query(query, params);
        return rows;
    },
    
    // Admin: Update order status
    // Cancelling an order returns its stock; un-cancelling takes it again
    updateOrderStatus: async (orderId, status) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [rows] = await conn.query('SELECT status FROM orders WHERE order_id = ? FOR UPDATE', [orderId]);
            if (rows.length === 0) {
                await conn.rollback();
                return;
            }
            const oldStatus = rows[0].status;

            let stockChange = null;
            if (status === 'cancelled' && oldStatus !== 'cancelled') stockChange = '+';
            if (status !== 'cancelled' && oldStatus === 'cancelled') stockChange = '-';

            if (stockChange) {
                const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
                for (const item of items) {
                    await conn.query(
                        `UPDATE products SET product_quantity = product_quantity ${stockChange} ? WHERE product_id = ?`,
                        [item.quantity, item.product_id]
                    );
                }
            }

            await conn.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

module.exports = Order;