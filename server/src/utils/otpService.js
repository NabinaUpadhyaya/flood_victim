/**
 * OTP Service
 * Secure random 6-digit numeric OTP generation, bcrypt hashing, single-use,
 * 10-minute expiry, cooldown rate limiting, and brute-force protection.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

/**
 * Generate a new secure 6-digit OTP and store its bcrypt hash
 */
async function generateAndSaveOtp({ userId, email, purpose }) {
  const cleanEmail = email.trim().toLowerCase();

  // Check cooldown on recent unconsumed requests
  const [recent] = await pool.query(
    `SELECT created_at FROM user_otps 
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL 
     ORDER BY id DESC LIMIT 1`,
    [cleanEmail, purpose]
  );

  if (recent.length > 0) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(recent[0].created_at).getTime()) / 1000);
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new Error(`कृपया नयाँ कोड अनुरोध गर्न ${remaining} सेकेन्ड पर्खनुहोस् (Please wait ${remaining} seconds before requesting a new OTP)`);
    }
  }

  // Generate 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any older unconsumed OTPs for this email and purpose
  await pool.query(
    `UPDATE user_otps SET consumed_at = NOW() 
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL`,
    [cleanEmail, purpose]
  );

  // Save new OTP record
  await pool.query(
    `INSERT INTO user_otps (user_id, email, otp_hash, purpose, expires_at, attempts)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [userId, cleanEmail, otpHash, purpose, expiresAt]
  );

  return { otp, expiresAt };
}

/**
 * Verify a single-use OTP
 */
async function verifyOtp({ email, otp, purpose }) {
  const cleanEmail = email.trim().toLowerCase();

  const [records] = await pool.query(
    `SELECT * FROM user_otps 
     WHERE email = ? AND purpose = ? AND consumed_at IS NULL 
     ORDER BY id DESC LIMIT 1`,
    [cleanEmail, purpose]
  );

  if (records.length === 0) {
    return {
      valid: false,
      message: 'कुनै सक्रिय ओटीपी फेला परेन। कृपया नयाँ कोड अनुरोध गर्नुहोस्। (No active OTP found)',
    };
  }

  const record = records[0];

  // Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    // Mark as consumed/expired
    await pool.query('UPDATE user_otps SET consumed_at = NOW() WHERE id = ?', [record.id]);
    return {
      valid: false,
      message: 'ओटीपी कोडको म्याद सकिएको छ। कृपया नयाँ कोड अनुरोध गर्नुहोस्। (OTP expired)',
      expired: true,
    };
  }

  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await pool.query('UPDATE user_otps SET consumed_at = NOW() WHERE id = ?', [record.id]);
    return {
      valid: false,
      message: 'धेरै पटक गलत ओटीपी प्रविष्ट गरियो। सुरक्षाका लागि यो कोड रद्द गरिएको छ। (Too many failed attempts)',
    };
  }

  // Compare hash
  const isMatch = await bcrypt.compare(otp.trim(), record.otp_hash);
  if (!isMatch) {
    await pool.query('UPDATE user_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      valid: false,
      message: `गलत ओटीपी कोड। बाँकी प्रयास: ${Math.max(0, remaining)} (Incorrect OTP code)`,
    };
  }

  // Mark single-use consumed
  await pool.query('UPDATE user_otps SET consumed_at = NOW() WHERE id = ?', [record.id]);

  return {
    valid: true,
    userId: record.user_id,
    email: cleanEmail,
  };
}

module.exports = {
  generateAndSaveOtp,
  verifyOtp,
  OTP_RESEND_COOLDOWN_SECONDS,
};
