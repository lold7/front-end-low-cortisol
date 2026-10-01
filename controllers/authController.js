const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const PasswordReset = require('../models/passwordResetModel');

// Password reset settings
const RESET_TOKEN_MINUTES = 30;      // how long a reset link stays valid
const MIN_PASSWORD_LENGTH = 8;

const RESET_REQUEST_MESSAGE = "If an account exists for that email, we've sent a password reset link. Please check your inbox (and spam folder).";
const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Please request a new one.';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const isTokenFormat = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);

const authController = {
    // Render the forms
    getLoginPage: (req, res) => res.render('webstore/login', { error: null }),
    getRegisterPage: (req, res) => res.render('webstore/register', { error: null }),
    getForgotPasswordPage: (req, res) => res.render('webstore/forgotPassword', { error: null, success: null }),

    // Step 1: request a reset link "by email".
    // DEMO: no real email is sent - the link that would be emailed is shown on the page instead.
    processForgotPassword: async (req, res) => {
        const email = (req.body.email || '').trim();
        try {
            const user = email ? await User.findByEmail(email) : null;
            let resetLink = null;

            if (user) {
                // Random token goes in the link; only its hash is saved in the database
                const token = crypto.randomBytes(32).toString('hex');
                await PasswordReset.createToken(user.user_id, hashToken(token), RESET_TOKEN_MINUTES);
                resetLink = `/auth/reset-password/${token}`;
            }

            res.render('webstore/forgotPassword', { error: null, success: RESET_REQUEST_MESSAGE, resetLink, email });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Step 2: open the link from the email and show the new-password form
    getResetPasswordPage: async (req, res) => {
        const { token } = req.params;
        try {
            const reset = isTokenFormat(token) ? await PasswordReset.findValidToken(hashToken(token)) : null;
            if (!reset) {
                return res.render('webstore/resetPassword', { token: null, error: INVALID_LINK_MESSAGE, success: null });
            }
            res.render('webstore/resetPassword', { token, error: null, success: null });
        } catch (error) {
            console.error('Reset password page error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Step 3: save the new password, then invalidate the link
    processResetPassword: async (req, res) => {
        const { token } = req.params;
        const { new_password, confirm_password } = req.body;
        try {
            const reset = isTokenFormat(token) ? await PasswordReset.findValidToken(hashToken(token)) : null;
            if (!reset) {
                return res.render('webstore/resetPassword', { token: null, error: INVALID_LINK_MESSAGE, success: null });
            }

            if (!new_password || new_password.length < MIN_PASSWORD_LENGTH) {
                return res.render('webstore/resetPassword', { token, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, success: null });
            }
            if (new_password !== confirm_password) {
                return res.render('webstore/resetPassword', { token, error: 'Passwords do not match.', success: null });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await User.updateUserPassword(reset.user_id, hashedPassword);
            await PasswordReset.deleteTokensForUser(reset.user_id);

            res.render('webstore/resetPassword', { token: null, error: null, success: 'Password reset successfully! You can now log in.' });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Process a Login
    loginUser: async (req, res) => {
        const { email, password, rememberMe } = req.body;
        try {
            const user = await User.findByEmail(email);
            
            // Compare typed password with the hashed password in database
            if (user && await bcrypt.compare(password, user.password_hash)) {
                // Save user info in the session
                req.session.userId = user.user_id;
                req.session.role = user.role;

                // Remember Me: keep the login for 30 days; otherwise the cookie
                // is a browser-session cookie and is cleared when the browser closes
                if (rememberMe === 'on') {
                    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
                } else {
                    req.session.cookie.expires = false;
                }
                
                // Redirect admins to the back-office, customers to the homepage
                return user.role === 'admin' ? res.redirect('/admin') : res.redirect('/');
            }
            res.render('webstore/login', { error: 'Invalid email or password' });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Process a Registration
    registerUser: async (req, res) => {
        const { username, email, password, phone } = req.body;
        try {
            // Hash the password with a salt round of 10
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.createCustomer(username, email, hashedPassword, phone);
            
            // Redirect to login after successful registration
            res.redirect('/auth/login');
        } catch (error) {
            console.error('Registration error:', error);
            res.render('webstore/register', { error: 'Email might already be in use.' });
        }
    },

    // Process a Logout
    logoutUser: (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/');
        });
    }
};

module.exports = authController;