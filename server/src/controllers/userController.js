/**
 * User Controller
 * User management operations and User Audit Logs (Admin only)
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { logUserAudit } = require('../utils/userAuditLogger');
const { generateAndSaveOtp } = require('../utils/otpService');
const { sendVerificationOtpEmail } = require('../utils/mailer');

// Get all staff users
async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, is_verified, created_at, updated_at FROM users ORDER BY id ASC'
    );
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'प्रयोगकर्ता सूची प्राप्त गर्न सकिएन (Failed to fetch users)',
      error: error.message,
    });
  }
}

// Create staff user (with Email OTP Verification: Pending)
async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = role || 'viewer';

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'यो इमेल ठेगाना पहिले नै दर्ता भइसकेको छ (Email already in use)',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Newly created accounts are immediately active and verified (no email verification requirement)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, 1, 1)',
      [name.trim(), cleanEmail, passwordHash, assignedRole]
    );

    const newUserId = result.insertId;

    // Record in dedicated User Audit Log (Preserves performed_by and affected user snapshots)
    await logUserAudit({
      action: 'Account Created',
      performedByUserId: req.user.id,
      performedByName: req.user.name,
      affectedUserId: newUserId,
      affectedUserName: name.trim(),
      affectedUserEmail: cleanEmail,
      affectedUserRole: assignedRole,
      description: `Account created by Admin ${req.user.name}`,
      ipAddress: req.ip,
    });

    // Also write to general audit log
    await logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_CREATE',
      ipAddress: req.ip,
      details: { new_user_id: newUserId, email: cleanEmail, role: assignedRole },
    });

    return res.status(201).json({
      success: true,
      message: 'नयाँ प्रयोगकर्ता खाता सफलतापूर्वक सिर्जना गरियो',
      user: {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        role: assignedRole,
        is_active: 1,
        is_verified: 1,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'प्रयोगकर्ता सिर्जना गर्न सकिएन (Failed to create user)',
      error: error.message,
    });
  }
}

// Update staff user
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, is_active } = req.body;

    const [existing] = await pool.query('SELECT id, name, email, role, is_active, is_verified FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'प्रयोगकर्ता फेला परेन (User not found)',
      });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : existing[0].email;

    // Check duplicate email if changed
    if (cleanEmail !== existing[0].email) {
      const [duplicate] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [cleanEmail, id]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'यो इमेल ठेगाना अन्य प्रयोगकर्ताले प्रयोग गरिसकेका छन् (Email already in use)',
        });
      }
    }

    let passwordHash = null;
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    let query = 'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?';
    const params = [
      name ? name.trim() : existing[0].name,
      cleanEmail,
      role || existing[0].role,
      is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active,
    ];

    if (passwordHash) {
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    // Track role changes specifically
    const roleChanged = role && role !== existing[0].role;
    if (roleChanged) {
      await logUserAudit({
        action: 'Account Role Changed',
        performedByUserId: req.user.id,
        performedByName: req.user.name,
        affectedUserId: id,
        affectedUserName: name ? name.trim() : existing[0].name,
        affectedUserEmail: cleanEmail,
        affectedUserRole: role,
        description: `Role changed from ${existing[0].role} to ${role} by Admin ${req.user.name}`,
        ipAddress: req.ip,
      });
    } else {
      await logUserAudit({
        action: 'Account Updated',
        performedByUserId: req.user.id,
        performedByName: req.user.name,
        affectedUserId: id,
        affectedUserName: name ? name.trim() : existing[0].name,
        affectedUserEmail: cleanEmail,
        affectedUserRole: role || existing[0].role,
        description: `User details updated by Admin ${req.user.name}`,
        ipAddress: req.ip,
      });
    }

    return res.json({
      success: true,
      message: 'प्रयोगकर्ता विवरण सफलतापूर्वक अद्यावधिक गरियो',
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'प्रयोगकर्ता अद्यावधिक गर्न सकिएन (Failed to update user)',
      error: error.message,
    });
  }
}

// Delete staff user
// CRITICAL: Must snapshot deleted user details so audit history remains intact forever!
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'तपाईंले आफ्नै खाता मेटाउन सक्नुहुन्न (Cannot delete your own account)',
      });
    }

    const [existing] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'प्रयोगकर्ता फेला परेन (User not found)',
      });
    }

    const targetUser = existing[0];

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    // Record in User Audit Log with full historical snapshots!
    await logUserAudit({
      action: 'Account Deleted',
      performedByUserId: req.user.id,
      performedByName: req.user.name,
      affectedUserId: targetUser.id,
      affectedUserName: targetUser.name,
      affectedUserEmail: targetUser.email,
      affectedUserRole: targetUser.role,
      description: `Account permanently deleted by Admin ${req.user.name}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'प्रयोगकर्ता सफलतापूर्वक मेटाइयो (User deleted successfully)',
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'प्रयोगकर्ता मेटाउन सकिएन (Failed to delete user)',
      error: error.message,
    });
  }
}

// Get User Audit Logs (Admin Only)
async function getUserAuditLogs(req, res) {
  try {
    const { search, email, action, role, date_from, date_to } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereConditions.push('(affected_user_name LIKE ? OR affected_user_email LIKE ? OR performed_by_name LIKE ? OR description LIKE ?)');
      params.push(s, s, s, s);
    }

    if (email && email.trim()) {
      whereConditions.push('affected_user_email LIKE ?');
      params.push(`%${email.trim().toLowerCase()}%`);
    }

    if (action && action.trim() && action !== 'all') {
      whereConditions.push('action = ?');
      params.push(action.trim());
    }

    if (role && role.trim() && role !== 'all') {
      whereConditions.push('affected_user_role = ?');
      params.push(role.trim());
    }

    if (date_from) {
      whereConditions.push('created_at >= ?');
      params.push(`${date_from} 00:00:00`);
    }

    if (date_to) {
      whereConditions.push('created_at <= ?');
      params.push(`${date_to} 23:59:59`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total matching logs
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM user_audit_logs ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Fetch paginated logs
    const [rows] = await pool.query(
      `SELECT * FROM user_audit_logs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

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
    console.error('getUserAuditLogs error:', error);
    return res.status(500).json({
      success: false,
      message: 'अडिट लग प्राप्त गर्न सकिएन (Failed to fetch user audit logs)',
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserAuditLogs,
};
