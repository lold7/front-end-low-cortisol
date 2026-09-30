const db = require('../config/db');

const Order = {
    // Process a checkout
    createOrder: async (userId, addressId, totalPrice, paymentMethod, cartItems) => {
        // Determine status based on payment method
        const orderStatus = paymentMethod === 'Cash on Delivery' ? 'pending' : 'completed';

        // 1. Create the main order record
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, address_id, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?)',
            [userId, addressId, totalPrice, paymentMethod, orderStatus]
        );
        const orderId = orderResult.insertId;

        // 2. Move items from the cart into the order_items table
        for (const item of cartItems) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.product_price]
            );
        }

        // 3. Empty the user's cart
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        return orderId;
    },

    // Get order history for the "My Account" page
    getOrderHistory: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', 
            [userId]
        );
        return rows;
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
    updateOrderStatus: async (orderId, status) => {
        await db.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, orderId]
        );
    }
};

module.exports = Order;