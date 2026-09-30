const db = require('../config/db');

const PaymentMethod = {
    // Get all payment methods for a user
    getPaymentMethodsByUserId: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return rows;
    },

    // Add a new payment method
    addPaymentMethod: async (userId, paymentData) => {
        // If this is set as default, unset other defaults
        if (paymentData.is_default) {
            await db.query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = ?', [userId]);
        }
        
        // Mask the card number (keep only last 4 digits)
        const cardNumber = paymentData.card_number || '';
        const maskedCard = '**** **** **** ' + cardNumber.slice(-4);

        const [result] = await db.query(
            'INSERT INTO payment_methods (user_id, provider, card_number_masked, cardholder_name, expiry_date, is_default) VALUES (?, ?, ?, ?, ?, ?)',
            [
                userId, 
                paymentData.provider || 'Credit Card', 
                maskedCard, 
                paymentData.cardholder_name, 
                paymentData.expiry_date, 
                paymentData.is_default ? true : false
            ]
        );
        return result.insertId;
    },

    // Delete a payment method
    deletePaymentMethod: async (paymentId, userId) => {
        await db.query('DELETE FROM payment_methods WHERE payment_method_id = ? AND user_id = ?', [paymentId, userId]);
    },

    // Set a payment method as default
    setDefaultPaymentMethod: async (paymentId, userId) => {
        await db.query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = ?', [userId]);
        await db.query('UPDATE payment_methods SET is_default = TRUE WHERE payment_method_id = ? AND user_id = ?', [paymentId, userId]);
    }
};

module.exports = PaymentMethod;
