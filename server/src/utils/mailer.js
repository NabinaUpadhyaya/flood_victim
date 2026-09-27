/**
 * Professional Mailer Utility
 * Supports SMTP configuration via environment variables with safe fallback.
 */

const nodemailer = require('nodemailer');

const path = require('path');
const dotenv = require('dotenv');

function reloadEnv() {
  dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });
}

function getTransporter() {
  reloadEnv();

  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (host && user && pass && !user.includes('your_email')) {
    if (host.includes('gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return null;
}

/**
 * Verify SMTP connection credentials
 */
async function verifySmtpConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('ℹ️ [MAILER] No SMTP credentials configured. Running in simulated console mode.');
    return { configured: false, message: 'SMTP not configured' };
  }

  try {
    await transporter.verify();
    console.log(`✅ [MAILER] SMTP connection verified successfully for ${process.env.SMTP_USER}`);
    return { configured: true, valid: true, email: process.env.SMTP_USER };
  } catch (error) {
    console.error(`❌ [MAILER] SMTP verification failed for ${process.env.SMTP_USER}:`, error.message);
    return { configured: true, valid: false, error: error.message };
  }
}

/**
 * Send an email with professional HTML formatting
 */
async function sendEmail({ to, subject, html, text }) {
  reloadEnv();
  const from = process.env.SMTP_FROM || `"इन्सेक (INSEC) प्रणाली" <${process.env.SMTP_USER || 'noreply@insec.org.np'}>`;
  const transporter = getTransporter();

  if (!transporter) {
    // Development / fallback mode: log safely to server terminal
    console.log('\n==================================================');
    console.log(`📨 [MAILER DEV SIMULATION] Email to: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`📄 Text Content:\n${text}`);
    console.log('==================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ [EMAIL SENT] Successfully sent to ${to} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Mail delivery error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Email Verification OTP Template
 */
async function sendVerificationOtpEmail({ to, name, otp }) {
  const subject = 'इन्सेक खाता इमेल प्रमाणीकरण कोड (INSEC Email Verification Code)';
  const text = `नमस्ते ${name || ''},\n\nतपाईंको इन्सेक प्रणाली (INSEC Data Collection System) खाता प्रमाणीकरणका लागि सुरक्षा कोड (OTP): ${otp}\n\nयो कोड १० मिनेट सम्म मात्र मान्य रहनेछ।\nयदि तपाईंले यो खाता खोल्नुभएको होइन भने, कृपया यो सन्देश बेवास्ता गर्नुहोस्।\n\n- इन्सेक नेपाल`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F8FA; margin: 0; padding: 24px; color: #1E293B; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #D8E2E8; padding: 32px; box-shadow: 0 4px 12px rgba(18, 59, 93, 0.05); }
        .header { text-align: center; border-bottom: 1px solid #D8E2E8; padding-bottom: 20px; margin-bottom: 24px; }
        .title { color: #123B5D; font-size: 20px; font-weight: bold; margin: 0; }
        .sub { color: #64748B; font-size: 13px; margin-top: 6px; }
        .greeting { font-size: 15px; font-weight: 600; color: #1E293B; margin-bottom: 12px; }
        .body-text { font-size: 13px; line-height: 1.6; color: #1E293B; }
        .otp-container { text-align: center; margin: 28px 0; }
        .otp-code { display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #123B5D; background: #DFF5F2; padding: 14px 28px; border-radius: 12px; border: 2px dashed #0F766E; }
        .expiry { color: #D97706; font-size: 12px; font-weight: 600; margin-top: 10px; }
        .security-notice { background-color: #F4F8FA; border-left: 4px solid #176B87; padding: 12px 16px; font-size: 12px; color: #64748B; border-radius: 0 8px 8px 0; margin-top: 24px; }
        .footer { text-align: center; font-size: 11px; color: #64748B; margin-top: 28px; border-top: 1px solid #D8E2E8; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">अनौपचारिक क्षेत्र सेवा केन्द्र (INSEC)</h2>
          <div class="sub">व्यक्तिगत घटना तथा प्रभावित व्यक्ति तथ्याङ्क प्रणाली</div>
        </div>
        <div class="greeting">नमस्ते ${name || 'प्रयोगकर्ता'},</div>
        <p class="body-text">
          केन्द्रीय प्रशासकद्वारा तपाईंको लागि नयाँ कर्मचारी खाता सिर्जना गरिएको छ। प्रणालीमा प्रवेश गर्न आफ्नो आधिकारिक इमेल ठेगाना प्रमाणीकरण गर्नुहोस्।
        </p>
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="expiry">⏱️ यो कोड १० मिनेट सम्म मात्र मान्य रहनेछ (Valid for 10 minutes)</div>
        </div>
        <div class="security-notice">
          <strong>सुरक्षा सूचना:</strong> यो कोड गोप्य राख्नुहोस् र कसैसँग साझा नगर्नुहोस्। इन्सेक प्राविधिक टोलीले कहिल्यै पनि तपाईंको कोड माग्ने छैन।
        </div>
        <div class="footer">
          © 2026 INSEC Nepal. All rights reserved.<br>
          यो एक स्वचालित सन्देश हो, कृपया यसको सिधै जवाफ नदिनुहोस्।
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send Password Reset OTP Template
 */
async function sendPasswordResetOtpEmail({ to, name, otp }) {
  const subject = 'इन्सेक पासवर्ड रिसेट सुरक्षा कोड (INSEC Password Reset Code)';
  const text = `नमस्ते ${name || ''},\n\nतपाईंको इन्सेक प्रणाली खाताको पासवर्ड रिसेट गर्न अनुरोध प्राप्त भएको छ।\nतपाईंको सुरक्षा कोड (OTP): ${otp}\n\nयो कोड १० मिनेट सम्म मात्र मान्य रहनेछ।\nयदि तपाईंले पासवर्ड रिसेट अनुरोध गर्नुभएको होइन भने, तुरुन्त आफ्नो खाता सुरक्षित राख्नुहोस्।\n\n- इन्सेक नेपाल`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F8FA; margin: 0; padding: 24px; color: #1E293B; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #D8E2E8; padding: 32px; box-shadow: 0 4px 12px rgba(18, 59, 93, 0.05); }
        .header { text-align: center; border-bottom: 1px solid #D8E2E8; padding-bottom: 20px; margin-bottom: 24px; }
        .title { color: #123B5D; font-size: 20px; font-weight: bold; margin: 0; }
        .sub { color: #64748B; font-size: 13px; margin-top: 6px; }
        .greeting { font-size: 15px; font-weight: 600; color: #1E293B; margin-bottom: 12px; }
        .body-text { font-size: 13px; line-height: 1.6; color: #1E293B; }
        .otp-container { text-align: center; margin: 28px 0; }
        .otp-code { display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #123B5D; background: #E8F3F6; padding: 14px 28px; border-radius: 12px; border: 2px dashed #176B87; }
        .expiry { color: #D97706; font-size: 12px; font-weight: 600; margin-top: 10px; }
        .security-notice { background-color: #F4F8FA; border-left: 4px solid #DC2626; padding: 12px 16px; font-size: 12px; color: #64748B; border-radius: 0 8px 8px 0; margin-top: 24px; }
        .footer { text-align: center; font-size: 11px; color: #64748B; margin-top: 28px; border-top: 1px solid #D8E2E8; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 class="title">अनौपचारिक क्षेत्र सेवा केन्द्र (INSEC)</h2>
          <div class="sub">व्यक्तिगत घटना तथा प्रभावित व्यक्ति तथ्याङ्क प्रणाली</div>
        </div>
        <div class="greeting">नमस्ते ${name || 'प्रयोगकर्ता'},</div>
        <p class="body-text">
          तपाईंको खाताको लागि पासवर्ड रिसेट गर्न अनुरोध प्राप्त भएको छ। नयाँ पासवर्ड सिर्जना गर्न तल दिइएको एक पटक मात्र प्रयोग हुने सुरक्षा कोड (OTP) प्रविष्ट गर्नुहोस्:
        </p>
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="expiry">⏱️ यो कोड १० मिनेट सम्म मात्र मान्य रहनेछ (Valid for 10 minutes)</div>
        </div>
        <div class="security-notice">
          <strong>सुरक्षा चेतावनी:</strong> यदि तपाईंले पासवर्ड रिसेटको लागि अनुरोध गर्नुभएको होइन भने कृपया तुरुन्त केन्द्रीय प्रशासकलाई सम्पर्क गर्नुहोस् वा यो सन्देश बेवास्ता गर्नुहोस्।
        </div>
        <div class="footer">
          © 2026 INSEC Nepal. All rights reserved.<br>
          यो एक स्वचालित सन्देश हो, कृपया यसको सिधै जवाफ नदिनुहोस्।
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, text });
}

module.exports = {
  sendEmail,
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
  verifySmtpConnection,
};
