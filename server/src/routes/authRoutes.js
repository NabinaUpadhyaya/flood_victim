/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);

// Email Verification
router.post('/verify-email', otpLimiter, authController.verifyEmail);
router.post('/resend-verification-otp', otpLimiter, authController.resendVerificationOtp);

// Forgot Password (Editor and Viewer)
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authController.resetPassword);

// SMTP Test Endpoint
router.get('/test-smtp', authController.testSmtp);

module.exports = router;
