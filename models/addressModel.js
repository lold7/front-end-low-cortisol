const db = require('../config/db');

const Address = {
    // Get all addresses for a user
    getAddressesByUserId: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return rows;
    },

    // Add a new address
    addAddress: async (userId, addressData) => {
        // If this is set as default, unset other defaults
        if (addressData.is_default) {
            await db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        }
        
        const [result] = await db.query(
            'INSERT INTO addresses (user_id, label, full_name, phone, address_line, city, province, postal_code, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                userId, 
                addressData.label || 'Home', 
                addressData.full_name, 
                addressData.phone || '', 
                addressData.address_line, 
                addressData.city || 'Bangkok', 
                addressData.province || 'Bangkok', 
                addressData.postal_code || '10110', 
                addressData.is_default ? true : false
            ]
        );
        return result.insertId;
    },

    // Delete an address
    deleteAddress: async (addressId, userId) => {
        await db.query('DELETE FROM addresses WHERE address_id = ? AND user_id = ?', [addressId, userId]);
    },

    // Set an address as default
    setDefaultAddress: async (addressId, userId) => {
        await db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        await db.query('UPDATE addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?', [addressId, userId]);
    }
};

module.exports = Address;
