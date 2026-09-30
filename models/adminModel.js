const db = require('../config/db');

const Admin = {
    // Fetch overview statistics for the admin dashboard
    getDashboardStats: async (limit = 10, offset = 0) => {
        const [productResult] = await db.query('SELECT COUNT(*) as total FROM products');
        const [orderResult] = await db.query('SELECT COUNT(*) as total FROM orders');
        const [customerResult] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['customer']);
        
        const [recentOrders] = await db.query(`
            SELECT o.order_id, u.username, o.total_price, o.status, o.created_at
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [Number(limit), Number(offset)]);

        return {
            totalProducts: productResult[0].total,
            totalOrders: orderResult[0].total,
            totalCustomers: customerResult[0].total,
            recentOrders: recentOrders
        };
    }
};

module.exports = Admin;
