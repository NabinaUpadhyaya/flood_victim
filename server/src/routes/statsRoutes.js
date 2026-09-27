/**
 * Statistics & Dashboard Routes
 * Viewers are allowed read-only access to stats.
 */

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, requireAnyAuth } = require('../middleware/auth');

router.get('/', authenticate, requireAnyAuth, statsController.getStats);

module.exports = router;
