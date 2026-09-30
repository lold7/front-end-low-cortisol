const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const PaymentMethod = require('../models/paymentMethodModel');

const cartController = {
    // View the shopping cart page
    viewCart: async (req, res) => {
        try {
            const userId = req.session.userId;
            const cartItems = await Cart.getCartByUserId(userId);
            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            res.render('webstore/cart', { cartItems: cartItems, total: total });
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

            const { product_id, quantity } = req.body;
            
            await Cart.addItem(userId, product_id, parseInt(quantity) || 1);
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

            res.render('webstore/checkout', {
                cartItems: cartItems,
                total: total,
                addresses: addresses
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
            const address_id = req.query.address_id || 1;

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

            const addressId = req.body.address_id || 1; // Passed to redirect back correctly

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

            const addressId = req.body.address_id || 1; // Passed via hidden input

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

            const addressId = req.body.address_id || 1; // Passed via hidden input

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
            
            // 1. Get their items
            const cartItems = await Cart.getCartByUserId(userId);
            if (cartItems.length === 0) return res.redirect('/cart');

            // 2. Calculate the total price
            const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            
            // 3. Create the order in the database
            await Order.createOrder(userId, addressId || 1, total, paymentMethod || 'Credit Card', cartItems);
            
            // 4. Clear the cart
            await Cart.clearCart(userId);
            
            res.redirect('/account/orders'); // Redirect to profile to see the order history
        } catch (error) {
            console.error('Checkout error:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = cartController;