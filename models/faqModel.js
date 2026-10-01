const db = require('../config/db');

const Faq = {
    // For the public webstore FAQ page (ordered by sort_order)
    getAllFaqs: async () => {
        const [rows] = await db.query('SELECT * FROM faqs ORDER BY sort_order ASC, faq_id ASC');
        return rows;
    }
};

module.exports = Faq;
