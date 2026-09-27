/**
 * Incident Record Routes
 *
 * Permission matrix:
 *   GET  (list / by id)  → admin, editor, viewer
 *   POST (create)        → admin, editor
 *   PUT  (update)        → admin, editor
 *   DELETE               → admin only
 *   GET  /export         → admin only
 */

const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const exportController = require('../controllers/exportController');
const { authenticate, requireAnyAuth, requireStaff, requireAdmin } = require('../middleware/auth');
const { validateIncidentRecord } = require('../middleware/validate');

// Admin-only Excel export (placed before :id route)
router.get('/export', authenticate, requireAdmin, exportController.exportExcel);

// Read — viewers, editors, admins
router.get('/', authenticate, requireAnyAuth, recordController.getRecords);
router.get('/:id', authenticate, requireAnyAuth, recordController.getRecordById);

// Write — editors & admins only
router.post('/', authenticate, requireStaff, validateIncidentRecord, recordController.createStaffRecord);
router.put('/:id', authenticate, requireStaff, validateIncidentRecord, recordController.updateRecord);

// Delete — admin only
router.delete('/:id', authenticate, requireAdmin, recordController.deleteRecord);

module.exports = router;
