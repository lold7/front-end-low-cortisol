// Single source of truth for category URLs (/category/:slug).
// The 5 original categories keep their existing short slugs so old links still work.
// Any new category added by an admin gets an auto slug; if the name has no
// latin letters/digits (e.g. Thai), fall back to its numeric id.
const LEGACY_SLUGS = {
    'Fiction': 'fiction',
    'Children': 'children',
    'Non-Fiction': 'nonfiction',
    'Mystery & Thriller': 'mystery',
    'Science & Technology': 'science'
};

function categorySlug(category) {
    const name = (category && category.category_name) || '';
    if (LEGACY_SLUGS[name]) return LEGACY_SLUGS[name];
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || String(category.category_id);
}

module.exports = { categorySlug, LEGACY_SLUGS };
