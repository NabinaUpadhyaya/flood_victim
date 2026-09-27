/**
 * User Audit Logger Utility
 * Records user management events (account creation, deletion, password reset, verification, role changes)
 * into the dedicated `user_audit_logs` table.
 * 
 * Crucial: Snapshots performed_by_name and affected_user details so that historical
 * audit records remain 100% intact even if the affected user is deleted!
 */

const pool = require('../config/db');

async function logUserAudit({
  action,
  performedByUserId = null,
  performedByName = 'System',
  affectedUserId = null,
  affectedUserName,
  affectedUserEmail,
  affectedUserRole,
  description = null,
  ipAddress = null,
}) {
  try {
    const query = `
      INSERT INTO user_audit_logs (
        action,
        performed_by_user_id,
        performed_by_name,
        affected_user_id,
        affected_user_name,
        affected_user_email,
        affected_user_role,
        description,
        ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      action,
      performedByUserId,
      performedByName || 'System',
      affectedUserId,
      affectedUserName || 'Unknown',
      affectedUserEmail || 'Unknown',
      affectedUserRole || 'viewer',
      description,
      ipAddress,
    ]);
  } catch (error) {
    console.error('Failed to write user audit log:', error.message);
    // Non-blocking: Do not crash request if audit log fails
  }
}

module.exports = {
  logUserAudit,
};
