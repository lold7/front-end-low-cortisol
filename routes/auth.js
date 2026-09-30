const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Show the forms
router.get('/auth/login', authController.getLoginPage);
router.get('/auth/register', authController.getRegisterPage);
router.get('/auth/forgot-password', authController.getForgotPasswordPage);

// Process the form submissions
router.post('/auth/login', authController.loginUser);
router.post('/auth/register', authController.registerUser);
router.post('/auth/forgot-password', authController.processForgotPassword);

// Handle logout
router.get('/auth/logout', authController.logoutUser);

module.exports = router;