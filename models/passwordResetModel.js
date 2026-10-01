const db = require('../config/db');

// Make sure the table exists even on databases created before it was added to init.sql
let tableReady = null;
const ensureTable = () => {
    if (!tableReady) {
        tableReady = db.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                reset_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash CHAR(64) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `).catch((err) => {
            tableReady = null; // retry on the next call
            throw err;
        });
    }
    return tableReady;
};

const PasswordReset = {
    // Replace any old tokens for this user with a new one (only the hash is stored)
    createToken: async (userId, tokenHash, minutesValid) => {
        await ensureTable();
        await db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]);
        await db.query(
            'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
            [userId, tokenHash, minutesValid]
        );
    },

    // Find a token that has not expired yet
    findValidToken: async (tokenHash) => {
        await ensureTable();
        const [rows] = await db.query(
            'SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > NOW()',
            [tokenHash]
        );
        return rows[0];
    },

    // Tokens are single-use: remove all of the user's tokens once the password is changed
    deleteTokensForUser: async (userId) => {
        await ensureTable();
        await db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]);
    }
};

module.exports = PasswordReset;
