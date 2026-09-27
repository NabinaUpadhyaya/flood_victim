/**
 * Rate Limiter Middleware
 * Protects public submission endpoints from spam and automated flooding.
 */

const rateLimit = require('express-rate-limit');

// Rate limiter for public record submissions: max 30 per 15 mins per IP
const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'धेरै पटक प्रयास गरियो। कृपया १५ मिनेटपछि पुनः प्रयास गर्नुहोस्। (Too many submissions from this IP, please try again later.)',
  },
});

// General API rate limiter for auth / login attempts: max 20 per 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'लगइनका धेरै असफल प्रयासहरू भए। कृपया १५ मिनेटपछि प्रयास गर्नुहोस्। (Too many login attempts, please try again later.)',
  },
});

// OTP & Password reset rate limiter: max 15 requests per 15 mins per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'धेरै पटक सुरक्षा कोड अनुरोध गरियो। कृपया १५ मिनेटपछि पुनः प्रयास गर्नुहोस्। (Too many OTP requests, please try again later.)',
  },
});

module.exports = {
  publicSubmitLimiter,
  authLimiter,
  otpLimiter,
};

