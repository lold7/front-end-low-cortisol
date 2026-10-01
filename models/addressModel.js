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

    // Get one address, but only if it belongs to this user (null otherwise)
    getAddressByIdForUser: async (addressId, userId) => {
        if (!/^\d+$/.test(String(addressId || ''))) return null;
        const [rows] = await db.query(
            'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
            [addressId, userId]
        );
        return rows[0] || null;
    },

    // Add a new address
    addAddress: async (userId, addressData) => {
        // Checkbox sends "on" when ticked; treat any truthy value as default
        let isDefault = !!addressData.is_default;

        // If the user has no default address yet (e.g. first address), make this one default
        if (!isDefault) {
            const [[{ cnt }]] = await db.query(
                'SELECT COUNT(*) AS cnt FROM addresses WHERE user_id = ? AND is_default = TRUE',
                [userId]
            );
            if (cnt === 0) isDefault = true;
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
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
                isDefault
            ]
        );
        return result.insertId;
    },

    // Delete an address
    deleteAddress: async (addressId, userId) => {
        await db.query('DELETE FROM addresses WHERE address_id = ? AND user_id = ?', [addressId, userId]);

        // If the deleted address was the default, promote the newest remaining address
        const [[{ cnt }]] = await db.query(
            'SELECT COUNT(*) AS cnt FROM addresses WHERE user_id = ? AND is_default = TRUE',
            [userId]
        );
        if (cnt === 0) {
            await db.query(
                'UPDATE addresses SET is_default = TRUE WHERE user_id = ? ORDER BY created_at DESC, address_id DESC LIMIT 1',
                [userId]
            );
        }
    },

    // Set an address as default
    setDefaultAddress: async (addressId, userId) => {
        await db.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
        await db.query('UPDATE addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?', [addressId, userId]);
    }
};

module.exports = Address;
