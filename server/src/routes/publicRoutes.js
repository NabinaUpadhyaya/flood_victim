/**
 * Public Routes
 * Allows anonymous citizens/volunteers to submit incident data without login.
 */

const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { publicSubmitLimiter } = require('../middleware/rateLimiter');
const { validateIncidentRecord } = require('../middleware/validate');
const { uploadPhotoMiddleware } = require('../middleware/upload');

// Public Photo Upload (optional)
router.post('/upload-photo', publicSubmitLimiter, uploadPhotoMiddleware, recordController.uploadPhoto);

// Public Submission (supports multipart photo or json)
router.post('/submit', publicSubmitLimiter, uploadPhotoMiddleware, validateIncidentRecord, recordController.createPublicRecord);

module.exports = router;
