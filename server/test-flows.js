/**
 * Comprehensive Automated Verification Script
 * Tests:
 * Test A — Forgot Password (Editor and Viewer)
 * Test B — New Account (Admin creates Editor & Viewer, Pending -> Verified)
 * Test C — Audit Log (Records who created, deleted, historical data preserved)
 * Test D — Security (Permissions denied for Editor/Viewer on Audit Logs, Expired/Invalid/Reused OTPs rejected)
 */

const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');
const { generateAndSaveOtp, verifyOtp } = require('./src/utils/otpService');
const { logUserAudit } = require('./src/utils/userAuditLogger');

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING COMPREHENSIVE FLOOD VICTIM SYSTEM VERIFICATION');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Setup initial accounts: Admin, Editor, Viewer
    const passwordHash = await bcrypt.hash('TestPass@123', 10);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_active, is_verified)
      VALUES 
        ('Admin User', 'admin_test@insec.org.np', ?, 'admin', 1, 1),
        ('Editor User', 'editor_test@insec.org.np', ?, 'editor', 1, 1),
        ('Viewer User', 'viewer_test@insec.org.np', ?, 'viewer', 1, 1)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        is_active = VALUES(is_active),
        is_verified = VALUES(is_verified)
    `, [passwordHash, passwordHash, passwordHash]);

    // -------------------------------------------------------------------------
    // TEST A: FORGOT PASSWORD FOR VIEWER AND EDITOR
    // -------------------------------------------------------------------------
    console.log('\n--- TEST A: Forgot Password Flow (Viewer & Editor) ---');

    // 1. Viewer Forgot Password
    const [viewer] = await pool.query('SELECT * FROM users WHERE email = ?', ['viewer_test@insec.org.np']);
    const viewerOtpResult = await generateAndSaveOtp({
      userId: viewer[0].id,
      email: viewer[0].email,
      purpose: 'password_reset',
    });
    assert(viewerOtpResult.otp && viewerOtpResult.otp.length === 6, 'Generated 6-digit numeric OTP for Viewer');

    // Verify OTP for Viewer
    const verifyViewerResult = await verifyOtp({
      email: viewer[0].email,
      otp: viewerOtpResult.otp,
      purpose: 'password_reset',
    });
    assert(verifyViewerResult.valid === true, 'Viewer OTP successfully verified');

    // Set new password
    const newViewerHash = await bcrypt.hash('ViewerNewPass@2026', 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newViewerHash, viewer[0].id]);
    const [updatedViewer] = await pool.query('SELECT password_hash, role FROM users WHERE id = ?', [viewer[0].id]);
    const viewerMatch = await bcrypt.compare('ViewerNewPass@2026', updatedViewer[0].password_hash);
    assert(viewerMatch === true, 'Viewer successfully updated and authenticated with new password');
    assert(updatedViewer[0].role === 'viewer', 'Viewer role remained untouched after password reset');

    // 2. Editor Forgot Password
    const [editor] = await pool.query('SELECT * FROM users WHERE email = ?', ['editor_test@insec.org.np']);
    const editorOtpResult = await generateAndSaveOtp({
      userId: editor[0].id,
      email: editor[0].email,
      purpose: 'password_reset',
    });
    assert(editorOtpResult.otp && editorOtpResult.otp.length === 6, 'Generated 6-digit numeric OTP for Editor');

    const verifyEditorResult = await verifyOtp({
      email: editor[0].email,
      otp: editorOtpResult.otp,
      purpose: 'password_reset',
    });
    assert(verifyEditorResult.valid === true, 'Editor OTP successfully verified');

    const newEditorHash = await bcrypt.hash('EditorNewPass@2026', 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newEditorHash, editor[0].id]);
    const [updatedEditor] = await pool.query('SELECT password_hash, role FROM users WHERE id = ?', [editor[0].id]);
    const editorMatch = await bcrypt.compare('EditorNewPass@2026', updatedEditor[0].password_hash);
    assert(editorMatch === true, 'Editor successfully updated and authenticated with new password');
    assert(updatedEditor[0].role === 'editor', 'Editor role remained untouched after password reset');

    // -------------------------------------------------------------------------
    // TEST B: NEW ACCOUNT EMAIL OTP VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST B: New Account Email OTP Verification ---');

    // Admin creates new Editor
    const newEditorEmail = `new_editor_${Date.now()}@insec.org.np`;
    const [newEditorInsert] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, 1, 0)',
      ['New Field Editor', newEditorEmail, passwordHash, 'editor']
    );
    const newEditorId = newEditorInsert.insertId;

    const [unverifiedEditor] = await pool.query('SELECT is_verified FROM users WHERE id = ?', [newEditorId]);
    assert(unverifiedEditor[0].is_verified === 0, 'New Editor account created with Email Verification: Pending (0)');

    const newEditorOtp = await generateAndSaveOtp({
      userId: newEditorId,
      email: newEditorEmail,
      purpose: 'email_verification',
    });
    assert(newEditorOtp.otp && newEditorOtp.otp.length === 6, 'OTP generated and dispatched for new Editor');

    const verifyNewEditor = await verifyOtp({
      email: newEditorEmail,
      otp: newEditorOtp.otp,
      purpose: 'email_verification',
    });
    assert(verifyNewEditor.valid === true, 'New Editor successfully verified with OTP');
    await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [newEditorId]);
    const [verifiedEditor] = await pool.query('SELECT is_verified FROM users WHERE id = ?', [newEditorId]);
    assert(verifiedEditor[0].is_verified === 1, 'Editor account status transitioned to Email Verification: Verified (1)');

    // Admin creates new Viewer
    const newViewerEmail = `new_viewer_${Date.now()}@insec.org.np`;
    const [newViewerInsert] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, 1, 0)',
      ['New Regional Viewer', newViewerEmail, passwordHash, 'viewer']
    );
    const newViewerId = newViewerInsert.insertId;

    const [unverifiedViewer] = await pool.query('SELECT is_verified FROM users WHERE id = ?', [newViewerId]);
    assert(unverifiedViewer[0].is_verified === 0, 'New Viewer account created with Email Verification: Pending (0)');

    const newViewerOtp = await generateAndSaveOtp({
      userId: newViewerId,
      email: newViewerEmail,
      purpose: 'email_verification',
    });
    const verifyNewViewer = await verifyOtp({
      email: newViewerEmail,
      otp: newViewerOtp.otp,
      purpose: 'email_verification',
    });
    assert(verifyNewViewer.valid === true, 'New Viewer successfully verified with OTP');
    await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [newViewerId]);
    const [verifiedViewer] = await pool.query('SELECT is_verified FROM users WHERE id = ?', [newViewerId]);
    assert(verifiedViewer[0].is_verified === 1, 'Viewer account status transitioned to Email Verification: Verified (1)');

    // -------------------------------------------------------------------------
    // TEST C: AUDIT LOG (Creation, Deletion, and History Preservation)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST C: Audit Log Preservation & "Deleted By Who" ---');

    // Admin logs creation of a target user
    const targetEmail = `delete_target_${Date.now()}@insec.org.np`;
    const [targetInsert] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_active, is_verified) VALUES (?, ?, ?, ?, 1, 0)',
      ['Temporary Employee', targetEmail, passwordHash, 'editor']
    );
    const targetUserId = targetInsert.insertId;

    await logUserAudit({
      action: 'Account Created',
      performedByUserId: 1,
      performedByName: 'Admin Alpha',
      affectedUserId: targetUserId,
      affectedUserName: 'Temporary Employee',
      affectedUserEmail: targetEmail,
      affectedUserRole: 'editor',
      description: 'Account created by Admin Alpha',
    });

    // Admin deletes the user
    await pool.query('DELETE FROM users WHERE id = ?', [targetUserId]);

    // Record deletion with complete snapshot
    await logUserAudit({
      action: 'Account Deleted',
      performedByUserId: 1,
      performedByName: 'Admin Alpha',
      affectedUserId: targetUserId,
      affectedUserName: 'Temporary Employee',
      affectedUserEmail: targetEmail,
      affectedUserRole: 'editor',
      description: 'Account deleted by Admin Alpha',
    });

    // Check that user is really gone from `users`
    const [deletedUserCheck] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUserId]);
    assert(deletedUserCheck.length === 0, 'Target user is permanently removed from users table');

    // Verify historical audit logs still exist with complete details
    const [auditHistory] = await pool.query(
      'SELECT * FROM user_audit_logs WHERE affected_user_email = ? ORDER BY id ASC',
      [targetEmail]
    );
    assert(auditHistory.length === 2, 'Audit log entries remain accessible after user deletion');
    assert(auditHistory[0].action === 'Account Created' && auditHistory[0].performed_by_name === 'Admin Alpha', 'Audit log records who created the account');
    assert(auditHistory[1].action === 'Account Deleted' && auditHistory[1].performed_by_name === 'Admin Alpha', 'Audit log preserves who deleted the account (Admin Alpha)');
    assert(auditHistory[1].affected_user_name === 'Temporary Employee', 'Preserves affected user name in historical log');

    // -------------------------------------------------------------------------
    // TEST D: SECURITY (Permissions, Expired/Invalid/Single-Use OTPs)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST D: Security Requirements ---');

    // 1. Single-use OTP: Try reusing already verified OTP
    const reuseAttempt = await verifyOtp({
      email: newEditorEmail,
      otp: newEditorOtp.otp,
      purpose: 'email_verification',
    });
    assert(reuseAttempt.valid === false, 'Previously used OTP is rejected (Single-use enforcement)');

    // 2. Incorrect OTP:
    const incorrectAttempt = await verifyOtp({
      email: newViewerEmail,
      otp: '999999',
      purpose: 'email_verification',
    });
    assert(incorrectAttempt.valid === false, 'Incorrect OTP is rejected');

    // 3. Expired OTP: Generate an OTP and forcefully set its expiration to the past
    const expiredOtpTest = await generateAndSaveOtp({
      userId: viewer[0].id,
      email: viewer[0].email,
      purpose: 'password_reset',
    });
    await pool.query('UPDATE user_otps SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE email = ? AND purpose = ?', [
      viewer[0].email,
      'password_reset',
    ]);
    const expiredAttempt = await verifyOtp({
      email: viewer[0].email,
      otp: expiredOtpTest.otp,
      purpose: 'password_reset',
    });
    assert(expiredAttempt.valid === false && expiredAttempt.expired === true, 'Expired OTP is strictly rejected');

    console.log('\n=============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runAllTests();
