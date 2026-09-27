/**
 * Public Routes
 * Allows anonymous citizens/volunteers to submit incident data without login.
 */

const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { publicSubmitLimiter } = require('../middleware/rateLimiter');
const { validateIncidentRecord } = require('../middleware/validate');

router.post('/submit', publicSubmitLimiter, validateIncidentRecord, recordController.createPublicRecord);

module.exports = router;
