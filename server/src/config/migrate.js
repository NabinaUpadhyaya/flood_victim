/**
 * Database Auto-Migration Helper
 * Ensures `is_verified` column, `user_otps`, and `user_audit_logs` tables exist.
 */

const pool = require('./db');

async function runMigrations() {
  try {
    // 1. Ensure is_verified column in users table
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_verified'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT TRUE");
      console.log('✅ Added is_verified column to users table');
    }

    // 1.1 Ensure role enum includes viewer
    try {
      await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer'");
    } catch (e) {
      // Ignore if already configured
    }

    // 2. Ensure user_otps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(150) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        purpose ENUM('email_verification', 'password_reset') NOT NULL,
        expires_at DATETIME NOT NULL,
        consumed_at DATETIME NULL,
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_otps_email_purpose (email, purpose),
        INDEX idx_user_otps_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Ensure user_audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        performed_by_user_id INT NULL,
        performed_by_name VARCHAR(150) NOT NULL,
        affected_user_id INT NULL,
        affected_user_name VARCHAR(150) NOT NULL,
        affected_user_email VARCHAR(150) NOT NULL,
        affected_user_role VARCHAR(50) NOT NULL,
        description TEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_audit_action (action),
        INDEX idx_user_audit_affected_email (affected_user_email),
        INDEX idx_user_audit_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Ensure administrator account exists for configured SMTP email
    const smtpEmail = (process.env.SMTP_USER || '').trim().toLowerCase();
    if (smtpEmail && smtpEmail.includes('@') && !smtpEmail.includes('your_email')) {
      const [existingUser] = await pool.query('SELECT id, role FROM users WHERE email = ?', [smtpEmail]);
      if (existingUser.length === 0) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Admin@12345', 10);
        await pool.query(
          'INSERT INTO users (name, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, 1, 1)',
          ['प्रशासक (Admin)', smtpEmail, hash, 'admin']
        );
        console.log(`✅ Provisioned administrator account for configured email: ${smtpEmail}`);
      }
    }

    console.log('✅ Database schema verified (user_otps & user_audit_logs ready)');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}
