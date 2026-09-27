/**
 * Record Controller
 * Handles CRUD operations for incident records, search, filtering, and audit trail.
 */

const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// Helper to generate sequential unique record codes (e.g. INSEC-2026-0016)
async function generateRecordCode() {
  const [rows] = await pool.query('SELECT id, record_code FROM incident_records ORDER BY id DESC LIMIT 1');
  const year = new Date().getFullYear();
  let nextSeq = 1;
  if (rows.length > 0 && rows[0].id) {
    nextSeq = rows[0].id + 1;
  }
  let candidate = `INSEC-${year}-${String(nextSeq).padStart(4, '0')}`;
  
  // Double-check candidate uniqueness
  const [existing] = await pool.query('SELECT id FROM incident_records WHERE record_code = ?', [candidate]);
  if (existing.length > 0) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `INSEC-${year}-${randomSuffix}`;
  }
  return candidate;
}

// Convert boolean-like input to 0 or 1
function toBool(val) {
  if (val === true || val === 1 || val === '1' || val === 'true') return 1;
  return 0;
}

// Public Submission
async function createPublicRecord(req, res) {
  try {
    const code = await generateRecordCode();
    const data = req.body;

    const query = `
      INSERT INTO incident_records (
        record_code, form_number, district, municipality, ward_number, location, collection_date,
        full_name, age, gender, family_contact, phone,
        incident_type, other_incident_type, incident_date, incident_location, incident_description,
        body_found, identified, search_status, family_informed,
        injury_type, treatment_location, current_condition,
        is_child, child_guardian_lost, child_separated_from_family, child_school_affected, child_other,
        is_woman, is_pregnant, is_postpartum, is_single_woman, is_woman_led_family, woman_other,
        verification_status, verified_by, data_collector, signature_info, collection_sign_date,
        created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        NULL
      )
    `;

    const values = [
      code,
      data.form_number || null,
      data.district?.trim(),
      data.municipality?.trim(),
      data.ward_number ? parseInt(data.ward_number, 10) : null,
      data.location || null,
      data.collection_date?.trim(),

      data.full_name?.trim(),
      data.age ? parseInt(data.age, 10) : null,
      data.gender,
      data.family_contact || null,
      data.phone || null,

      data.incident_type,
      data.other_incident_type || null,
      data.incident_date || null,
      data.incident_location || null,
      data.incident_description || null,

      data.body_found || null,
      data.identified || null,
      data.search_status || null,
      data.family_informed || null,

      data.injury_type || null,
      data.treatment_location || null,
      data.current_condition || null,

      toBool(data.is_child),
      toBool(data.child_guardian_lost),
      toBool(data.child_separated_from_family),
      toBool(data.child_school_affected),
      data.child_other || null,

      toBool(data.is_woman),
      toBool(data.is_pregnant),
      toBool(data.is_postpartum),
      toBool(data.is_single_woman),
      toBool(data.is_woman_led_family),
      data.woman_other || null,

      data.verification_status || 'pending',
      data.verified_by || null,
      data.data_collector || 'सार्वजनिक संकलन (Public User)',
      data.signature_info || null,
      data.collection_sign_date || data.collection_date,
    ];

    const [result] = await pool.query(query, values);

    // Audit log
    await logAudit({
      action: 'PUBLIC_SUBMIT',
      recordId: result.insertId,
      ipAddress: req.ip || req.connection?.remoteAddress,
      details: {
        record_code: code,
        name: data.full_name,
        district: data.district,
        incident_type: data.incident_type,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'तथ्याङ्क सफलतापूर्वक दर्ता भयो! (Record registered successfully)',
      record_code: code,
      record_id: result.insertId,
    });
  } catch (error) {
    console.error('createPublicRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'तथ्याङ्क दर्ता गर्दा त्रुटि भयो (Failed to submit record)',
      error: error.message,
    });
  }
}

// Staff Create Record
async function createStaffRecord(req, res) {
  try {
    const code = req.body.record_code || (await generateRecordCode());
    const data = req.body;

    const query = `
      INSERT INTO incident_records (
        record_code, form_number, district, municipality, ward_number, location, collection_date,
        full_name, age, gender, family_contact, phone,
        incident_type, other_incident_type, incident_date, incident_location, incident_description,
        body_found, identified, search_status, family_informed,
        injury_type, treatment_location, current_condition,
        is_child, child_guardian_lost, child_separated_from_family, child_school_affected, child_other,
        is_woman, is_pregnant, is_postpartum, is_single_woman, is_woman_led_family, woman_other,
        verification_status, verified_by, data_collector, signature_info, collection_sign_date,
        created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?
      )
    `;

    const values = [
      code,
      data.form_number || null,
      data.district?.trim(),
      data.municipality?.trim(),
      data.ward_number ? parseInt(data.ward_number, 10) : null,
      data.location || null,
      data.collection_date?.trim(),

      data.full_name?.trim(),
      data.age ? parseInt(data.age, 10) : null,
      data.gender,
      data.family_contact || null,
      data.phone || null,

      data.incident_type,
      data.other_incident_type || null,
      data.incident_date || null,
      data.incident_location || null,
      data.incident_description || null,

      data.body_found || null,
      data.identified || null,
      data.search_status || null,
      data.family_informed || null,

      data.injury_type || null,
      data.treatment_location || null,
      data.current_condition || null,

      toBool(data.is_child),
      toBool(data.child_guardian_lost),
      toBool(data.child_separated_from_family),
      toBool(data.child_school_affected),
      data.child_other || null,

      toBool(data.is_woman),
      toBool(data.is_pregnant),
      toBool(data.is_postpartum),
      toBool(data.is_single_woman),
      toBool(data.is_woman_led_family),
      data.woman_other || null,

      data.verification_status || 'pending',
      data.verified_by || null,
      data.data_collector || req.user.name,
      data.signature_info || null,
      data.collection_sign_date || data.collection_date,
      req.user.id,
    ];

    const [result] = await pool.query(query, values);

    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'CREATE_RECORD',
      recordId: result.insertId,
      ipAddress: req.ip,
      details: {
        record_code: code,
        name: data.full_name,
        district: data.district,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'नयाँ रेकर्ड सफलतापूर्वक सिर्जना गरियो (Record created successfully)',
      record_code: code,
      record_id: result.insertId,
    });
  } catch (error) {
    console.error('createStaffRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'रेकर्ड सिर्जना गर्न सकिएन (Failed to create record)',
      error: error.message,
    });
  }
}

// Build WHERE clause and params for filtering
function buildFilterClause(query) {
  const conditions = [];
  const params = [];

  const {
    search,
    district,
    municipality,
    incident_type,
    gender,
    is_child,
    is_woman,
    verification_status,
    body_found,
    identified,
    search_status,
    date_from,
    date_to,
  } = query;

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(`(
      ir.record_code LIKE ? OR
      ir.full_name LIKE ? OR
      ir.phone LIKE ? OR
      ir.family_contact LIKE ? OR
      ir.location LIKE ? OR
      ir.district LIKE ? OR
      ir.municipality LIKE ? OR
      ir.form_number LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term, term);
  }

  if (district && district.trim()) {
    conditions.push('ir.district = ?');
    params.push(district.trim());
  }

  if (municipality && municipality.trim()) {
    conditions.push('ir.municipality = ?');
    params.push(municipality.trim());
  }

  if (incident_type && incident_type.trim()) {
    conditions.push('ir.incident_type = ?');
    params.push(incident_type.trim());
  }

  if (gender && gender.trim()) {
    conditions.push('ir.gender = ?');
    params.push(gender.trim());
  }

  if (is_child !== undefined && is_child !== '') {
    conditions.push('ir.is_child = ?');
    params.push(toBool(is_child));
  }

  if (is_woman !== undefined && is_woman !== '') {
    conditions.push('ir.is_woman = ?');
    params.push(toBool(is_woman));
  }

  if (verification_status && verification_status.trim()) {
    conditions.push('ir.verification_status = ?');
    params.push(verification_status.trim());
  }

  if (body_found && body_found.trim()) {
    conditions.push('ir.body_found = ?');
    params.push(body_found.trim());
  }

  if (identified && identified.trim()) {
    conditions.push('ir.identified = ?');
    params.push(identified.trim());
  }

  if (search_status && search_status.trim()) {
    conditions.push('ir.search_status = ?');
    params.push(search_status.trim());
  }

  if (date_from && date_from.trim()) {
    conditions.push('ir.collection_date >= ?');
    params.push(date_from.trim());
  }

  if (date_to && date_to.trim()) {
    conditions.push('ir.collection_date <= ?');
    params.push(date_to.trim());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

// Get Records with Pagination & Filters
async function getRecords(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { whereClause, params } = buildFilterClause(req.query);

    // Count query
    const countSql = `SELECT COUNT(*) AS total FROM incident_records ir ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query
    const allowedSort = ['id', 'record_code', 'collection_date', 'full_name', 'district', 'incident_type', 'created_at'];
    const sortBy = allowedSort.includes(req.query.sort_by) ? req.query.sort_by : 'id';
    const order = req.query.order === 'ASC' ? 'ASC' : 'DESC';

    const dataSql = `
      SELECT 
        ir.*,
        u_create.name AS creator_name,
        u_update.name AS updater_name
      FROM incident_records ir
      LEFT JOIN users u_create ON ir.created_by = u_create.id
      LEFT JOIN users u_update ON ir.updated_by = u_update.id
      ${whereClause}
      ORDER BY ir.${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('getRecords error:', error);
    return res.status(500).json({
      success: false,
      message: 'तथ्याङ्क सूची प्राप्त गर्न सकिएन (Failed to fetch records)',
      error: error.message,
    });
  }
}

// Get Single Record by ID
async function getRecordById(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        ir.*,
        u_create.name AS creator_name,
        u_create.email AS creator_email,
        u_update.name AS updater_name,
        u_update.email AS updater_email
      FROM incident_records ir
      LEFT JOIN users u_create ON ir.created_by = u_create.id
      LEFT JOIN users u_update ON ir.updated_by = u_update.id
      WHERE ir.id = ?
    `;
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'रेकर्ड फेला परेन (Record not found)',
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('getRecordById error:', error);
    return res.status(500).json({
      success: false,
      message: 'रेकर्ड विवरण प्राप्त गर्न सकिएन (Failed to fetch record details)',
      error: error.message,
    });
  }
}

// Update Record (Staff)
async function updateRecord(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if record exists
    const [existing] = await pool.query('SELECT * FROM incident_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'अपडेट गर्न खोजिएको रेकर्ड फेला परेन (Record not found)',
      });
    }

    const query = `
      UPDATE incident_records SET
        form_number = ?, district = ?, municipality = ?, ward_number = ?, location = ?, collection_date = ?,
        full_name = ?, age = ?, gender = ?, family_contact = ?, phone = ?,
        incident_type = ?, other_incident_type = ?, incident_date = ?, incident_location = ?, incident_description = ?,
        body_found = ?, identified = ?, search_status = ?, family_informed = ?,
        injury_type = ?, treatment_location = ?, current_condition = ?,
        is_child = ?, child_guardian_lost = ?, child_separated_from_family = ?, child_school_affected = ?, child_other = ?,
        is_woman = ?, is_pregnant = ?, is_postpartum = ?, is_single_woman = ?, is_woman_led_family = ?, woman_other = ?,
        verification_status = ?, verified_by = ?, data_collector = ?, signature_info = ?, collection_sign_date = ?,
        updated_by = ?
      WHERE id = ?
    `;

    const values = [
      data.form_number !== undefined ? data.form_number : existing[0].form_number,
      data.district?.trim() || existing[0].district,
      data.municipality?.trim() || existing[0].municipality,
      data.ward_number ? parseInt(data.ward_number, 10) : null,
      data.location || null,
      data.collection_date?.trim() || existing[0].collection_date,

      data.full_name?.trim() || existing[0].full_name,
      data.age !== undefined && data.age !== null && data.age !== '' ? parseInt(data.age, 10) : null,
      data.gender || existing[0].gender,
      data.family_contact || null,
      data.phone || null,

      data.incident_type || existing[0].incident_type,
      data.other_incident_type || null,
      data.incident_date || null,
      data.incident_location || null,
      data.incident_description || null,

      data.body_found || null,
      data.identified || null,
      data.search_status || null,
      data.family_informed || null,

      data.injury_type || null,
      data.treatment_location || null,
      data.current_condition || null,

      toBool(data.is_child),
      toBool(data.child_guardian_lost),
      toBool(data.child_separated_from_family),
      toBool(data.child_school_affected),
      data.child_other || null,

      toBool(data.is_woman),
      toBool(data.is_pregnant),
      toBool(data.is_postpartum),
      toBool(data.is_single_woman),
      toBool(data.is_woman_led_family),
      data.woman_other || null,

      data.verification_status || existing[0].verification_status,
      data.verified_by || existing[0].verified_by,
      data.data_collector || existing[0].data_collector,
      data.signature_info || existing[0].signature_info,
      data.collection_sign_date || existing[0].collection_sign_date,

      req.user.id,
      id,
    ];

    await pool.query(query, values);

    // Audit log
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'UPDATE_RECORD',
      recordId: parseInt(id, 10),
      ipAddress: req.ip,
      details: {
        record_code: existing[0].record_code,
        changes: {
          verification_status: data.verification_status,
          district: data.district,
          full_name: data.full_name,
        },
      },
    });

    return res.json({
      success: true,
      message: 'रेकर्ड सफलतापूर्वक अद्यावधिक (Update) गरियो',
    });
  } catch (error) {
    console.error('updateRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'रेकर्ड अद्यावधिक गर्दा त्रुटि भयो (Failed to update record)',
      error: error.message,
    });
  }
}

// Delete Record (Admin Only)
async function deleteRecord(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, record_code, full_name, district FROM incident_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'मेटाउन खोजिएको रेकर्ड फेला परेन (Record not found)',
      });
    }

    const rec = existing[0];

    await pool.query('DELETE FROM incident_records WHERE id = ?', [id]);

    // Audit log
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DELETE_RECORD',
      recordId: parseInt(id, 10),
      ipAddress: req.ip,
      details: {
        deleted_record_code: rec.record_code,
        deleted_name: rec.full_name,
        district: rec.district,
      },
    });

    return res.json({
      success: true,
      message: `रेकर्ड (${rec.record_code}) सफलतापूर्वक मेटाइयो (Record deleted successfully)`,
    });
  } catch (error) {
    console.error('deleteRecord error:', error);
    return res.status(500).json({
      success: false,
      message: 'रेकर्ड मेटाउन सकिएन (Failed to delete record)',
      error: error.message,
    });
  }
}

module.exports = {
  createPublicRecord,
  createStaffRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  buildFilterClause,
};
