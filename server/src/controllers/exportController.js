/**
 * Export Controller
 * Exports incident records to genuine Microsoft Excel (.xlsx) files.
 * Restricted to Administrator role.
 */

const pool = require('../config/db');
const { generateIncidentExcel } = require('../utils/excelGenerator');
const { buildFilterClause } = require('./recordController');
const { logAudit } = require('../utils/auditLogger');

async function exportExcel(req, res) {
  try {
    const { whereClause, params } = buildFilterClause(req.query);

    const sql = `
      SELECT ir.*
      FROM incident_records ir
      ${whereClause}
      ORDER BY ir.id ASC
    `;

    const [records] = await pool.query(sql, params);

    // Human-friendly description of active filters
    const filterParts = [];
    if (req.query.district) filterParts.push(`जिल्ला: ${req.query.district}`);
    if (req.query.incident_type) filterParts.push(`घटना: ${req.query.incident_type}`);
    if (req.query.is_child === '1') filterParts.push('बालबालिका मात्र');
    if (req.query.is_woman === '1') filterParts.push('महिला मात्र');
    if (req.query.verification_status) filterParts.push(`सत्यापन: ${req.query.verification_status}`);
    const filterDescription = filterParts.length > 0 ? filterParts.join(', ') : 'सम्पूर्ण तथ्याङ्क (All Records)';

    const workbook = await generateIncidentExcel(records, { filterDescription });

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
    const filename = `INSEC_Incident_Records_${dateFormatted}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();

    // Audit log
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'EXPORT_EXCEL',
      ipAddress: req.ip,
      details: {
        record_count: records.length,
        filters: req.query,
      },
    });
  } catch (error) {
    console.error('exportExcel error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'एक्सेल फाइल तयार गर्दा त्रुटि भयो (Failed to generate Excel export)',
        error: error.message,
      });
    }
  }
}

module.exports = {
  exportExcel,
};
