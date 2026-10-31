/**
 * Incident Record Routes
 *
 * Permission matrix:
 *   GET  (list / by id)       → admin, editor, viewer
 *   POST (create)             → admin, editor
 *   PUT  (update)             → admin, editor
 *   DELETE                    → admin only
 *   GET  /export              → admin only
 *   POST /upload-photo        → admin, editor
 */

const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const exportController = require('../controllers/exportController');
const { authenticate, requireAnyAuth, requireStaff, requireAdmin } = require('../middleware/auth');
const { validateIncidentRecord } = require('../middleware/validate');
const { uploadPhotoMiddleware } = require('../middleware/upload');

// Admin-only Excel export (placed before :id route)
router.get('/export', authenticate, requireAdmin, exportController.exportExcel);

// Dedicated Photo Upload for Staff (Editor/Admin)
router.post('/upload-photo', authenticate, requireStaff, uploadPhotoMiddleware, recordController.uploadPhoto);

// Read — viewers, editors, admins
router.get('/', authenticate, requireAnyAuth, recordController.getRecords);
router.get('/:id', authenticate, requireAnyAuth, recordController.getRecordById);

// Write — editors & admins only (supports multipart form photo or json body)
router.post('/', authenticate, requireStaff, uploadPhotoMiddleware, validateIncidentRecord, recordController.createStaffRecord);
router.put('/:id', authenticate, requireStaff, uploadPhotoMiddleware, validateIncidentRecord, recordController.updateRecord);

// Delete — admin only
router.delete('/:id', authenticate, requireAdmin, recordController.deleteRecord);

module.exports = router;
