/**
 * Authentication and Role Authorization Middleware
 *
 * Roles (highest to lowest privilege):
 *   admin  — full access (CRUD, delete, export, user management)
 *   editor — read + create + update records
 *   viewer — read-only access to dashboard and records
 */

const { verifyToken } = require('../config/jwt');
const pool = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'प्रमाणीकरण आवश्यक छ (Authentication token missing or invalid)',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'प्रमाणीकरण टोकन अमान्य वा म्याद सकिएको छ (Invalid or expired token)',
      });
    }

    // Verify user exists and is active in database
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'प्रयोगकर्ता फेला परेन वा निष्क्रिय गरिएको छ (User inactive or not found)',
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'आन्तरिक सर्भर त्रुटि (Internal authentication error)',
    });
  }
}

// Role authorization helpers
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'लगइन आवश्यक छ (Login required)',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'तपाईंलाई यो कार्य गर्ने अनुमति छैन (Permission denied: insufficient privileges)',
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  // Admin only: delete, export, user management
  requireAdmin: requireRole('admin'),
  // Editor + Admin: create & update records
  requireStaff: requireRole('admin', 'editor'),
  // Viewer + Editor + Admin: read-only dashboard & records
  requireAnyAuth: requireRole('admin', 'editor', 'viewer'),
};
