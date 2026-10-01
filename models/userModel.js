const db = require('../config/db');

const User = {
    // Find a user for login
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // Find a user by ID (useful for profile pages)
    findById: async (userId) => {
        const [rows] = await db.query('SELECT user_id, username, email, phone, role FROM users WHERE user_id = ?', [userId]);
        return rows[0];
    },

    // Create a new customer during registration
    createCustomer: async (username, email, passwordHash, phone) => {
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, phone || null, 'customer']
        );
        return result.insertId;
    },

    // Create a new admin via the backoffice
    createAdmin: async (username, email, passwordHash, phone) => {
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, phone || null, 'admin']
        );
        return result.insertId;
    },

    // Update user profile information
    updateUserProfile: async (userId, username, email, phone) => {
        const [result] = await db.query(
            'UPDATE users SET username = ?, email = ?, phone = ? WHERE user_id = ?',
            [username, email, phone || null, userId]
        );
        return result.affectedRows > 0;
    },

    // Get a user's password hash by given ID
    findPasswordHashById: async (userId) => {
        const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
        return rows[0] ? rows[0].password_hash : null;
    },

    // Update the user's password by ID
    updateUserPassword: async (userId, newPasswordHash) => {
        const [result] = await db.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [newPasswordHash, userId]
        );
        return result.affectedRows > 0;
    },

    // Admin: Get all customers with their order stats
    getAllCustomers: async (searchQuery = '') => {
        let query = `
            SELECT 
                u.user_id, u.username, u.email, u.phone, u.created_at,
                COUNT(o.order_id) as order_count,
                SUM(o.total_price) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.user_id = o.user_id AND o.status != 'cancelled'
            WHERE u.role = 'customer'
        `;
        
        let queryParams = [];
        
        if (searchQuery) {
            query += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
            queryParams.push('%' + searchQuery + '%', '%' + searchQuery + '%');
        }
        
        query += `
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
        `;
        
        const [rows] = await db.query(query, queryParams);
        return rows;
    }
};

module.exports = User;