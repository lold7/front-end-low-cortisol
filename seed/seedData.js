const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeed() {
    console.log('Starting database seed process...');

    try {
        // 1. Create the Admin User
        const adminPassword = await bcrypt.hash('admin123', 10);
        await db.query(
            `INSERT IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
            ['Admin Owner', 'admin@bookstore.com', adminPassword, 'admin']
        );
        console.log('Admin user created (email: admin@bookstore.com, password: admin123)');

        // 2. Create the 5 Required Categories
        const categories = [
            'Fiction', 
            'Non-Fiction', 
            'Science & Technology', 
            'Children', 
            'Mystery & Thriller'
        ];

        for (const catName of categories) {
            await db.query(
                `INSERT IGNORE INTO categories (category_name, is_visible) VALUES (?, ?)`,
                [catName, true]
            );
        }
        console.log('5 Categories created.');

        // Fetch the generated category IDs from the database
        const [categoryRows] = await db.query('SELECT category_id, category_name FROM categories');

        // 3. Generate 12 Products for each category (Total: 60 products)
        let productCount = 0;
        
        for (const category of categoryRows) {
            for (let i = 1; i <= 12; i++) {
                const productName = `${category.category_name} Book ${i}`;
                const description = `This is a fantastic book about ${category.category_name}. It is book number ${i} in our catalog.`;
                const price = (Math.random() * (40 - 10) + 10).toFixed(2);
                
                const imagesJson = JSON.stringify(['https://via.placeholder.com/300x400?text=Book+Cover']);
                const attributesJson = JSON.stringify({ format: 'Paperback', pages: Math.floor(Math.random() * 300) + 100 });

                await db.query(
                    `INSERT INTO products (category_id, product_name, product_description, product_price, product_images, product_attributes) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [category.category_id, productName, description, price, imagesJson, attributesJson]
                );
                productCount++;
            }
        }
        
        console.log(`Successfully generated ${productCount} products (12 per category).`);
        console.log('Seeding complete. You can now close this script.');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        process.exit();
    }
}

runSeed();