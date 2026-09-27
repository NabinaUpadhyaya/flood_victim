/**
 * Stats Controller
 * Aggregates live statistical data, casualty counts, vulnerability breakdowns, and district trends.
 */

const pool = require('../config/db');

async function getStats(req, res) {
  try {
    // 1. Overall counts
    const [summaryRows] = await pool.query(`
      SELECT
        COUNT(*) AS total_records,
        SUM(CASE WHEN incident_type = 'death' THEN 1 ELSE 0 END) AS total_deaths,
        SUM(CASE WHEN incident_type = 'missing' THEN 1 ELSE 0 END) AS total_missing,
        SUM(CASE WHEN incident_type = 'injured' THEN 1 ELSE 0 END) AS total_injured,
        SUM(CASE WHEN incident_type NOT IN ('death', 'missing', 'injured') THEN 1 ELSE 0 END) AS total_other,
        SUM(CASE WHEN is_child = 1 THEN 1 ELSE 0 END) AS total_children,
        SUM(CASE WHEN is_woman = 1 THEN 1 ELSE 0 END) AS total_women,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS total_verified,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN identified = 'no' THEN 1 ELSE 0 END) AS total_unidentified,
        SUM(CASE WHEN body_found = 'yes' THEN 1 ELSE 0 END) AS total_bodies_found,
        SUM(CASE WHEN current_condition = 'under_treatment' THEN 1 ELSE 0 END) AS total_under_treatment
      FROM incident_records
    `);

    const summary = summaryRows[0] || {};

    // 2. Incident by district
    const [districtRows] = await pool.query(`
      SELECT district, COUNT(*) AS count
      FROM incident_records
      GROUP BY district
      ORDER BY count DESC
      LIMIT 10
    `);

    // 3. Incident by type
    const [typeRows] = await pool.query(`
      SELECT incident_type, COUNT(*) AS count
      FROM incident_records
      GROUP BY incident_type
      ORDER BY count DESC
    `);

    // 4. Incident by gender
    const [genderRows] = await pool.query(`
      SELECT gender, COUNT(*) AS count
      FROM incident_records
      GROUP BY gender
    `);

    // 5. Children and women breakdown
    const [vulnerabilityRows] = await pool.query(`
      SELECT
        SUM(child_guardian_lost) AS child_guardian_lost,
        SUM(child_separated_from_family) AS child_separated,
        SUM(child_school_affected) AS child_school_affected,
        SUM(is_pregnant) AS pregnant_women,
        SUM(is_postpartum) AS postpartum_women,
        SUM(is_single_woman) AS single_women,
        SUM(is_woman_led_family) AS woman_led_family
      FROM incident_records
    `);

    // 6. Recent 5 audit logs
    const [recentLogs] = await pool.query(`
      SELECT id, user_email, user_role, action, record_id, created_at
      FROM audit_logs
      ORDER BY id DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      stats: {
        total_records: Number(summary.total_records) || 0,
        total_deaths: Number(summary.total_deaths) || 0,
        total_missing: Number(summary.total_missing) || 0,
        total_injured: Number(summary.total_injured) || 0,
        total_other: Number(summary.total_other) || 0,
        total_children: Number(summary.total_children) || 0,
        total_women: Number(summary.total_women) || 0,
        total_verified: Number(summary.total_verified) || 0,
        total_pending: Number(summary.total_pending) || 0,
        total_unidentified: Number(summary.total_unidentified) || 0,
        total_bodies_found: Number(summary.total_bodies_found) || 0,
        total_under_treatment: Number(summary.total_under_treatment) || 0,
      },
      charts: {
        byDistrict: districtRows,
        byType: typeRows,
        byGender: genderRows,
        vulnerabilities: vulnerabilityRows[0] || {},
      },
      recentLogs,
    });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'तथ्याङ्क सारांश प्राप्त गर्न सकिएन (Failed to calculate statistics)',
      error: error.message,
    });
  }
}

module.exports = {
  getStats,
};
