const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const Address = require('../models/addressModel');
const PaymentMethod = require('../models/paymentMethodModel');

const accountController = {
    // Render the main profile dashboard
    getProfilePage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const userProfile = await User.findById(userId);
            const orderHistory = await Order.getOrderHistory(userId);

            res.render('webstore/profile', { 
                user: userProfile, 
                profileUser: userProfile,
                orders: orderHistory 
            });
        } catch (error) {
            console.error('Profile page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const { username, email, phone } = req.body;
            await User.updateUserProfile(userId, username, email, phone);

            const userProfile = await User.findById(userId);
            const orderHistory = await Order.getOrderHistory(userId);
            
            res.render('webstore/profile', { 
                user: userProfile, 
                profileUser: userProfile,
                orders: orderHistory,
                success: 'Profile updated successfully!',
                error: null
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.redirect('/account/profile');
        }
    },

    // Update password
    updatePassword: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            const { currentPassword, newPassword, confirmPassword } = req.body;
            
            // Re-fetch profile and orders to re-render the page
            const userProfile = await User.findById(userId);
            const orderHistory = await Order.getOrderHistory(userId);

            if (newPassword !== confirmPassword) {
                return res.render('webstore/profile', {
                    user: userProfile,
                    profileUser: userProfile,
                    orders: orderHistory,
                    error: 'New passwords do not match.',
                    success: null
                });
            }

            const currentHash = await User.findPasswordHashById(userId);
            const isMatch = await bcrypt.compare(currentPassword, currentHash);
            
            if (!isMatch) {
                return res.render('webstore/profile', {
                    user: userProfile,
                    profileUser: userProfile,
                    orders: orderHistory,
                    error: 'Incorrect current password.',
                    success: null
                });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            await User.updateUserPassword(userId, newHash);

            res.render('webstore/profile', {
                user: userProfile,
                profileUser: userProfile,
                orders: orderHistory,
                error: null,
                success: 'Password changed successfully!'
            });
        } catch (error) {
            console.error('Update password error:', error);
            res.redirect('/account/profile');
        }
    },

    // Render the full order history list
    getOrdersPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            // Fetch the user's past orders
            const orders = await Order.getOrderHistory(userId);
            
            // Fetch the specific items for each order so they can be displayed in the view
            for (let order of orders) {
                const items = await Order.getOrderDetails(order.order_id, userId);
                order.items = items;
            }

            res.render('webstore/orderHistory', { orders });
        } catch (error) {
            console.error('Orders page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render a specific past receipt/order detail
    getOrderDetails: async (req, res) => {
        try {
            const userId = req.session.userId;
            const orderId = req.params.id;

            if (!userId) return res.redirect('/auth/login');

            const orderItems = await Order.getOrderDetails(orderId, userId);

            res.render('webstore/orderHistory', { 
                orderId: orderId,
                items: orderItems 
            });
        } catch (error) {
            console.error('Order details error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Render the wishlist page
    getWishlistPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            // Fetch the user's wishlist
            const wishlistItems = await Wishlist.getWishlistByUserId(userId);

            res.render('webstore/wishlist', { wishlistItems });
        } catch (error) {
            console.error('Wishlist page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Toggle an item in the wishlist
    toggleWishlist: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const { product_id } = req.body;
            if (!product_id) {
                return res.status(400).json({ success: false, message: 'Product ID is required' });
            }

            // Check if it's already in the wishlist
            const inWishlist = await Wishlist.isInWishlist(userId, product_id);

            if (inWishlist) {
                // Remove it
                await Wishlist.removeItem(product_id, userId);
                return res.json({ success: true, action: 'removed' });
            } else {
                // Add it
                await Wishlist.addItem(userId, product_id);
                return res.json({ success: true, action: 'added' });
            }
        } catch (error) {
            console.error('Toggle wishlist error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    },

    // Render the address book page
    getAddressBookPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            // Fetch real addresses from the database
            const addresses = await Address.getAddressesByUserId(userId);

            res.render('webstore/addressBook', { addresses });
        } catch (error) {
            console.error('Address book page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Add a new address
    addAddress: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await Address.addAddress(userId, req.body);
            res.redirect('/account/addresses');
        } catch (error) {
            console.error('Add address error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Delete an address
    deleteAddress: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await Address.deleteAddress(req.params.id, userId);
            res.redirect('/account/addresses');
        } catch (error) {
            console.error('Delete address error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Set an address as default
    setDefaultAddress: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await Address.setDefaultAddress(req.params.id, userId);
            res.redirect('/account/addresses');
        } catch (error) {
            console.error('Set default address error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // ========================================
    // PAYMENT METHODS
    // ========================================

    // Render the payment methods page
    getPaymentMethodsPage: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            // Fetch real payment methods from database
            const paymentMethods = await PaymentMethod.getPaymentMethodsByUserId(userId);
            
            res.render('webstore/paymentMethods', { 
                paymentMethods,
                error: req.query.error,
                success: req.query.success
            });
        } catch (error) {
            console.error('Payment methods page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Add a new payment method
    addPaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await PaymentMethod.addPaymentMethod(userId, req.body);
            res.redirect('/account/payment-methods?success=Payment method added successfully');
        } catch (error) {
            console.error('Add payment method error:', error);
            res.redirect('/account/payment-methods?error=Failed to add payment method');
        }
    },

    // Delete a payment method
    deletePaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await PaymentMethod.deletePaymentMethod(req.params.id, userId);
            res.redirect('/account/payment-methods?success=Payment method removed');
        } catch (error) {
            console.error('Delete payment method error:', error);
            res.redirect('/account/payment-methods?error=Failed to delete payment method');
        }
    },

    // Set a payment method as default
    setDefaultPaymentMethod: async (req, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.redirect('/auth/login');

            await PaymentMethod.setDefaultPaymentMethod(req.params.id, userId);
            res.redirect('/account/payment-methods?success=Default payment method updated');
        } catch (error) {
            console.error('Set default payment method error:', error);
            res.redirect('/account/payment-methods?error=Failed to set default method');
        }
    }
};

module.exports = accountController;