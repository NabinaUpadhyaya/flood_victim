/**
 * Auth Controller
 * Handles user login, profile inspection, email OTP verification, and forgot password.
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../config/jwt');
const { logAudit } = require('../utils/auditLogger');
const { logUserAudit } = require('../utils/userAuditLogger');
const { generateAndSaveOtp, verifyOtp } = require('../utils/otpService');
const { sendVerificationOtpEmail, sendPasswordResetOtpEmail } = require('../utils/mailer');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'इमेल र पासवर्ड दुबै आवश्यक छ (Email and password are required)',
      });
    }

    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active, is_verified FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'इमेल वा पासवर्ड मिलेन (Invalid email or password)',
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'यो खाता निष्क्रिय गरिएको छ। कृपया प्रशासकसँग सम्पर्क गर्नुहोस्। (Account is deactivated)',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'इमेल वा पासवर्ड मिलेन (Invalid email or password)',
      });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
      details: { client: req.headers['user-agent'] },
    });

    return res.json({
      success: true,
      message: 'सफलतापूर्वक लगइन भयो (Logged in successfully)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'लगइन गर्दा आन्तरिक सर्भर त्रुटि (Internal server error during login)',
    });
  }
}

async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'प्रयोगकर्ता जानकारी प्राप्त गर्न सकिएन (Failed to fetch user profile)',
    });
  }
}

/**
 * Verify Email with OTP
 */
async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'इमेल र ओटीपी दुबै आवश्यक छ (Email and OTP are required)',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active, is_verified FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'प्रयोगकर्ता फेला परेन (User not found)',
      });
    }

    const user = users[0];
    const result = await verifyOtp({ email: cleanEmail, otp, purpose: 'email_verification' });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        expired: Boolean(result.expired),
      });
    }

    // Mark verified in DB
    await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
      message: 'इमेल सफलतापूर्वक प्रमाणीकरण भयो (Email verified successfully)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('verifyEmail error:', error);
    return res.status(500).json({
      success: false,
      message: 'इमेल प्रमाणीकरण गर्दा समस्या आयो (Internal error during email verification)',
    });
  }
}

/**
 * Resend Email Verification OTP
 */
async function resendVerificationOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'इमेल ठेगाना आवश्यक छ (Email is required)',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active, is_verified FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'प्रयोगकर्ता फेला परेन (User not found)',
      });
    }

    const user = users[0];
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'यो खाता पहिले नै प्रमाणित भइसकेको छ (Account already verified)',
      });
    }

    try {
      const { otp } = await generateAndSaveOtp({
        userId: user.id,
        email: user.email,
        purpose: 'email_verification',
      });
      await sendVerificationOtpEmail({ to: user.email, name: user.name, otp });

      return res.json({
        success: true,
        message: 'नयाँ प्रमाणीकरण कोड पठाइएको छ। कृपया आफ्नो इमेल जाँच गर्नुहोस्। (Verification code resent)',
      });
    } catch (otpErr) {
      if (otpErr.message.includes('सेकेन्ड पर्खनुहोस्') || otpErr.message.includes('seconds')) {
        return res.status(429).json({
          success: false,
          message: otpErr.message,
        });
      }
      throw otpErr;
    }
  } catch (error) {
    console.error('resendVerificationOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'नयाँ कोड पठाउन सकिएन (Failed to resend verification code)',
    });
  }
}

/**
 * Request Password Reset OTP
 * (Works for Editor and Viewer users, protects against account enumeration)
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'कृपया आफ्नो दर्ता गरिएको इमेल प्रविष्ट गर्नुहोस्',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE email = ?',
      [cleanEmail]
    );

    let simulationOtp = null;

    if (users.length > 0 && users[0].is_active) {
      const user = users[0];
      try {
        const { otp } = await generateAndSaveOtp({
          userId: user.id,
          email: user.email,
          purpose: 'password_reset',
        });

        const mailResult = await sendPasswordResetOtpEmail({ to: user.email, name: user.name, otp });
        if (mailResult && mailResult.simulated) {
          simulationOtp = otp;
        }

        await logUserAudit({
          action: 'Password Reset Requested',
          performedByUserId: user.id,
          performedByName: user.name,
          affectedUserId: user.id,
          affectedUserName: user.name,
          affectedUserEmail: user.email,
          affectedUserRole: user.role,
          description: 'User initiated password reset request via email OTP',
          ipAddress: req.ip,
        });
      } catch (otpErr) {
        if (otpErr.message.includes('सेकेन्ड पर्खनुहोस्') || otpErr.message.includes('seconds')) {
          return res.status(429).json({
            success: false,
            message: otpErr.message,
          });
        }
        console.error('Error sending reset email:', otpErr);
      }
    }

    // Always return uniform message to prevent account enumeration
    return res.json({
      success: true,
      message: 'यदि उक्त इमेल दर्ता छ भने, ६-अङ्कको सुरक्षा कोड पठाइएको छ। कृपया आफ्नो इनबक्स जाँच गर्नुहोस्।',
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'अनुरोध प्रक्रियामा त्रुटि आयो',
    });
  }
}

/**
 * Reset Password with Verified OTP
 */
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'कृपया इमेल, ओटीपी र नयाँ पासवर्ड सबै प्रविष्ट गर्नुहोस्',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'पासवर्ड कम्तिमा ६ वर्णको हुनुपर्छ',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'अमान्य अनुरोध वा प्रयोगकर्ता फेला परेन',
      });
    }

    const user = users[0];
    const result = await verifyOtp({ email: cleanEmail, otp, purpose: 'password_reset' });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        expired: Boolean(result.expired),
      });
    }

    // Hash new password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);

    // Update password only — NEVER alter user role or permissions!
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    await logUserAudit({
      action: 'Password Successfully Changed',
      performedByUserId: user.id,
      performedByName: user.name,
      affectedUserId: user.id,
      affectedUserName: user.name,
      affectedUserEmail: user.email,
      affectedUserRole: user.role,
      description: 'Password successfully changed using single-use OTP',
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'तपाईंको नयाँ पासवर्ड सफलतापूर्वक सुरक्षित गरियो। अब नयाँ पासवर्डबाट लगइन गर्नुहोस्।',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'पासवर्ड परिवर्तन गर्न सकिएन',
    });
  }
}

/**
 * Test SMTP Configuration & Delivery
 */
async function testSmtp(req, res) {
  try {
    const { verifySmtpConnection, sendEmail } = require('../utils/mailer');
    const status = await verifySmtpConnection();

    let sendResult = null;
    const sendTo = req.query.sendTo || req.query.email;
    if (sendTo) {
      sendResult = await sendEmail({
        to: sendTo,
        subject: 'इन्सेक इमेल परीक्षण (INSEC SMTP Delivery Test)',
        text: `नमस्ते,\n\nयो इन्सेक प्रणालीबाट तपाईंको आधिकारिक इमेल कन्फिगरेसन परीक्षण सन्देश हो।\n\n- INSEC Technical Team`,
        html: `
          <div style="font-family:sans-serif;padding:24px;border:1px solid #D8E2E8;border-radius:12px;max-width:520px;background:#ffffff;">
            <h2 style="color:#123B5D;margin-top:0;">इन्सेक व्यक्तिगत घटना तथ्याङ्क प्रणाली</h2>
            <p style="color:#1E293B;font-size:14px;">यो तपाईंको आधिकारिक इमेल (<strong>${process.env.SMTP_USER}</strong>) बाट सफलतापूर्वक पठाइएको परीक्षण सन्देश हो।</p>
            <div style="background:#DFF5F2;padding:14px;border-radius:8px;color:#0F766E;font-weight:bold;margin:16px 0;border:1px solid #0F766E/20;">
              ✅ Gmail SMTP जडान तथा इमेल डेलिभरी पूर्ण रूपमा सफल भयो!
            </div>
            <p style="font-size:12px;color:#64748B;">© 2026 INSEC Nepal. All rights reserved.</p>
          </div>
        `,
      });
    }

    return res.json({
      success: status.valid !== false,
      status,
      sendResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  login,
  getMe,
  verifyEmail,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  testSmtp,
};
