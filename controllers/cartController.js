const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const PaymentMethod = require('../models/paymentMethodModel');

// Resolve which of the user's addresses to use: the requested one if it is theirs,
// otherwise their default, otherwise their newest. Never another user's address.
async function resolveUserAddressId(userId, requestedId) {
    const owned = await Address.getAddressByIdForUser(requestedId, userId);
    if (owned) return owned.address_id;
    const addresses = await Address.getAddressesByUserId(userId); // default first
    return addresses.length > 0 ? addresses[0].address_id : null;
}

const cartController = {
    // View the shopping cart page
    viewCart: async (req, res) => {
        try {
            const userId = req.session.userId;
            const cartItems = await Cart.getCartByUserId(userId);
            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            res.render('webstore/cart', { cartItems: cartItems, total: total, error: req.query.error || null });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Add a book to the cart
    addToCart: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.redirect('/auth/login');
            }

            const { product_id } = req.body;
            const qty = parseInt(req.body.quantity) || 1;

            // Server-side checks — never trust the form (the id/qty can be edited by hand)
            const product = /^\d+$/.test(String(product_id))
                ? await Product.getStorefrontProductById(product_id)
                : null;
            if (!product) {
                // Hidden, in a hidden category, or doesn't exist
                return res.status(404).render('webstore/404', { message: 'This book does not exist or is no longer available.' });
            }

            const backToProduct = (code) => res.redirect(`/product/${product.product_id}?cart_error=${code}`);
            const stock = parseInt(product.product_quantity) || 0;

            if (qty < 1 || qty > 10) return backToProduct('invalid_quantity');
            if (stock <= 0) return backToProduct('out_of_stock');

            // Format: must be one of the formats this book actually has.
            // Missing (e.g. added from the wishlist) → default to the first format.
            const attrs = typeof product.product_attributes === 'string'
                ? JSON.parse(product.product_attributes || '{}')
                : (product.product_attributes || {});
            const formats = attrs.format ? (Array.isArray(attrs.format) ? attrs.format : [attrs.format]) : [];
            let selectedAttributes = null;
            if (formats.length > 0) {
                const requested = String(req.body.selected_format || '').trim().toLowerCase();
                const match = requested
                    ? formats.find(f => String(f).toLowerCase() === requested)
                    : formats[0];
                if (!match) return backToProduct('invalid_format');
                selectedAttributes = { format: match };
            }

            // Stock is per book, so count every format of this book already in the cart
            const alreadyInCart = await Cart.getItemQuantity(userId, product.product_id);
            if (alreadyInCart + qty > stock) return backToProduct('not_enough_stock');

            await Cart.addItem(userId, product.product_id, qty, selectedAttributes);
            res.redirect('/cart'); // Send them to the basket after adding
        } catch (error) {
            console.error('Add to cart error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Update cart item quantity
    updateCart: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');
            
            const { cart_item_id, quantity } = req.body;
            if (parseInt(quantity) > 0) {
                await Cart.updateItemQuantity(cart_item_id, userId, parseInt(quantity));
            }
            res.redirect('/cart');
        } catch (error) {
            console.error('Update cart error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Remove item from cart
    removeFromCart: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const { cart_item_id } = req.body;
            await Cart.removeItem(cart_item_id, userId);
            res.redirect('/cart');
        } catch (error) {
            console.error('Remove from cart error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render checkout page
    getCheckoutPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const cartItems = await Cart.getCartByUserId(userId);
            if (cartItems.length === 0) {
                return res.redirect('/cart');
            }

            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            
            // Fetch real addresses from the database
            const addresses = await Address.getAddressesByUserId(userId);

            // Pre-select the default address, or the first one if none is marked default
            const selectedAddressId = addresses.length > 0 ? addresses[0].address_id : null;

            res.render('webstore/checkout', {
                cartItems: cartItems,
                total: total,
                addresses: addresses,
                selectedAddressId: selectedAddressId
            });
        } catch (error) {
            console.error('Checkout GET error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render choose payment page
    getChoosePaymentPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const cartItems = await Cart.getCartByUserId(userId);
            if (cartItems.length === 0) return res.redirect('/cart');

            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            const address_id = await resolveUserAddressId(userId, req.query.address_id);
            if (!address_id) return res.redirect('/checkout'); // no saved address yet

            // Fetch real payment methods from the database
            const paymentMethods = await PaymentMethod.getPaymentMethodsByUserId(userId);

            res.render('webstore/choosePayment', { 
                total: total, 
                address_id: address_id,
                paymentMethods: paymentMethods
            });
        } catch (error) {
            console.error('Choose Payment GET error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Add a new payment method
    addPaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const addressId = req.body.address_id || ''; // Passed to redirect back correctly

            await PaymentMethod.addPaymentMethod(userId, req.body);
            res.redirect(`/choosePayment?address_id=${addressId}`);
        } catch (error) {
            console.error('Add payment method error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Delete a payment method
    deletePaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const addressId = req.body.address_id || ''; // Passed via hidden input

            await PaymentMethod.deletePaymentMethod(req.params.id, userId);
            res.redirect(`/choosePayment?address_id=${addressId}`);
        } catch (error) {
            console.error('Delete payment method error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Set a payment method as default
    setDefaultPaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const addressId = req.body.address_id || ''; // Passed via hidden input

            await PaymentMethod.setDefaultPaymentMethod(req.params.id, userId);
            res.redirect(`/choosePayment?address_id=${addressId}`);
        } catch (error) {
            console.error('Set default payment method error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Process the checkout
    checkout: async (req, res) => {
        try {
            const userId = req.session.userId;
            const { addressId, paymentMethod } = req.body;
            
            if (!userId) return res.redirect('/auth/login');

            // 1. Get their items
            const cartItems = await Cart.getCartByUserId(userId);
            if (cartItems.length === 0) return res.redirect('/cart');

            // The address must belong to this user — never fall back to a hard-coded id
            const address = await Address.getAddressByIdForUser(addressId, userId);
            if (!address) return res.redirect('/checkout');

            // 2. Calculate the total price
            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            
            // 3. Create the order in the database
            //    (also deducts stock and clears the cart inside one transaction)
            await Order.createOrder(userId, address.address_id, total, paymentMethod || 'Credit Card', cartItems);
            
            res.redirect('/account/orders?placed=1'); // Show the success message on the order history page
        } catch (error) {
            if (error.code === 'OUT_OF_STOCK') {
                return res.redirect('/cart?error=' + encodeURIComponent(error.message));
            }
            console.error('Checkout error:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = cartController;