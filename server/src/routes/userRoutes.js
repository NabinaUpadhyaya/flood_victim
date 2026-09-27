/**
 * User Management Routes (Admin Only)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateUserPayload } = require('../middleware/validate');

// Strictly Admin Only
router.use(authenticate, requireAdmin);

router.get('/', userController.getUsers);
router.get('/audit-logs', userController.getUserAuditLogs);
router.post('/', validateUserPayload(false), userController.createUser);
router.put('/:id', validateUserPayload(true), userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
