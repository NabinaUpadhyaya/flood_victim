/**
 * Audit Logger Utility
 * Records administrative and editorial actions into audit_logs table.
 */

const pool = require('../config/db');

async function logAudit({
  userId = null,
  userEmail = null,
  userRole = null,
  action,
  recordId = null,
  details = null,
  ipAddress = null,
}) {
  try {
    const detailsString = details
      ? (typeof details === 'string' ? details : JSON.stringify(details))
      : null;

    const query = `
      INSERT INTO audit_logs (user_id, user_email, user_role, action, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      userId,
      userEmail,
      userRole,
      action,
      recordId,
      detailsString,
      ipAddress,
    ]);
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
    // Non-blocking: Do not crash request if audit log fails
  }
}

module.exports = {
  logAudit,
};
