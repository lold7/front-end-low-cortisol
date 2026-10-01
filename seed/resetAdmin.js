// Create or reset the default admin account in the local MySQL database (uses .env).
// Usage: npm run reset-admin            -> admin@bookstore.com / admin123
//        npm run reset-admin -- me@x.com mypass
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function resetAdmin() {
    const email = process.argv[2] || 'admin@bookstore.com';
    const password = process.argv[3] || 'admin123';

    try {
        const hash = await bcrypt.hash(password, 10);
        const [rows] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            await db.query(
                `UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?`,
                [hash, email]
            );
            console.log(`Admin password reset: ${email} / ${password}`);
        } else {
            await db.query(
                `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')`,
                ['Admin User', email, hash]
            );
            console.log(`Admin created: ${email} / ${password}`);
        }
    } catch (error) {
        console.error('Could not reset admin:', error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

resetAdmin();
