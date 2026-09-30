'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCw,
  KeyRound,
} from 'lucide-react';
import {
  loginUser,
  setAuthSession,
  getStoredToken,
  requestForgotPasswordOtp,
  resetUserPassword,
} from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline error warnings for Login Form (no browser popups)
  const [loginEmailError, setLoginEmailError] = useState<string | null>(null);
  const [loginPasswordError, setLoginPasswordError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  // Inline error warnings for Forgot Password Modal
  const [forgotEmailError, setForgotEmailError] = useState<string | null>(null);
  const [forgotOtpError, setForgotOtpError] = useState<string | null>(null);
  const [forgotNewPasswordError, setForgotNewPasswordError] = useState<string | null>(null);
  const [forgotConfirmPasswordError, setForgotConfirmPasswordError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (getStoredToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (forgotCooldown > 0) {
      const timer = setTimeout(() => setForgotCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginEmailError(null);
    setLoginPasswordError(null);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasErr = false;

    if (!email.trim()) {
      setLoginEmailError('कृपया आधिकारिक इमेल प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (!emailRegex.test(email.trim())) {
      setLoginEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा: user@example.com)');
      hasErr = true;
    }

    if (!password) {
      setLoginPasswordError('कृपया पासवर्ड प्रविष्ट गर्नुहोस्');
      hasErr = true;
    }

    if (hasErr) return;

    try {
      setLoading(true);
      setError(null);
      const res = await loginUser(email.trim(), password);
      if (res.success && res.token && res.user) {
        setAuthSession(res.token, res.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'लगइन असफल भयो। कृपया इमेल र पासवर्ड जाँच गर्नुहोस्।';
      setError(msg);
      if (msg.includes('पासवर्ड') || msg.toLowerCase().includes('password')) {
        setLoginPasswordError(msg);
      } else if (msg.includes('इमेल') || msg.toLowerCase().includes('email')) {
        setLoginEmailError(msg);
      } else {
        setLoginEmailError('कृपया इमेल जाँच गर्नुहोस्');
        setLoginPasswordError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Request OTP
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailError(null);
    setForgotFeedback(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail.trim()) {
      setForgotEmailError('कृपया दर्ता गरिएको आधिकारिक इमेल प्रविष्ट गर्नुहोस्');
      return;
    } else if (!emailRegex.test(forgotEmail.trim())) {
      setForgotEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await requestForgotPasswordOtp(forgotEmail.trim());
      setForgotFeedback({
        type: 'success',
        message: res.message || 'तपाईंको आधिकारिक इमेलमा सुरक्षा कोड पठाइएको छ। कृपया आफ्नो इनबक्स जाँच गर्नुहोस्।',
      });
      setForgotOtp('');
      setForgotCooldown(60);
      setForgotStep('otp');
    } catch (err: any) {
      const msg = err.message || 'अनुरोध प्रक्रियामा त्रुटि आयो';
      setForgotEmailError(msg);
      setForgotFeedback({ type: 'error', message: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (forgotCooldown > 0 || !forgotEmail) return;
    try {
      setForgotLoading(true);
      setForgotFeedback(null);
      const res = await requestForgotPasswordOtp(forgotEmail.trim());
      setForgotFeedback({ type: 'success', message: res.message || 'नयाँ सुरक्षा कोड तपाईंको इमेलमा पठाइयो' });
      setForgotOtp('');
      setForgotCooldown(60);
    } catch (err: any) {
      setForgotFeedback({ type: 'error', message: err.message || 'नयाँ कोड पठाउन सकिएन' });
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Forgot Password - Reset with OTP
  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotOtpError(null);
    setForgotNewPasswordError(null);
    setForgotConfirmPasswordError(null);
    setForgotFeedback(null);

    let hasErr = false;

    if (!forgotOtp || forgotOtp.trim().length === 0) {
      setForgotOtpError('कृपया ६-अङ्कको सुरक्षा कोड प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (forgotOtp.trim().length < 6) {
      setForgotOtpError('सुरक्षा कोड ६ अङ्कको हुनुपर्छ');
      hasErr = true;
    }

    if (!newPassword) {
      setForgotNewPasswordError('कृपया नयाँ पासवर्ड प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (newPassword.length < 6) {
      setForgotNewPasswordError('नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
      hasErr = true;
    }

    if (!confirmPassword) {
      setForgotConfirmPasswordError('कृपया नयाँ पासवर्ड पुनः प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (newPassword !== confirmPassword) {
      setForgotConfirmPasswordError('दुवै पासवर्ड मिलेनन्। कृपया पुनः जाँच गर्नुहोस्।');
      hasErr = true;
    }

    if (hasErr) return;

    try {
      setForgotLoading(true);
      const res = await resetUserPassword({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.success) {
        setForgotStep('success');
      }
    } catch (err: any) {
      const msg = err.message || 'पासवर्ड रिसेट असफल भयो';
      if (msg.includes('पासवर्ड') || msg.toLowerCase().includes('password')) {
        setForgotNewPasswordError(msg);
      } else if (msg.includes('कोड') || msg.toLowerCase().includes('otp')) {
        setForgotOtpError(msg);
      }
      setForgotFeedback({ type: 'error', message: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Open Forgot Password Modal
  const openForgotPassword = () => {
    setForgotEmail(email || '');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setForgotFeedback(null);
    setForgotEmailError(null);
    setForgotOtpError(null);
    setForgotNewPasswordError(null);
    setForgotConfirmPasswordError(null);
    setForgotStep('email');
    setShowForgotModal(true);
  };

  // Helper to fill credentials for testing
  const setQuickCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError(null);
    setLoginEmailError(null);
    setLoginPasswordError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#F4F8FA] via-[#DFF5F2]/30 to-[#F4F8FA] px-4 py-8">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#D8E2E8] overflow-hidden">
        {/* Form Header */}
        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-[#DC2626] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-sm">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                आधिकारिक इमेल (Official Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginEmailError) setLoginEmailError(null);
                    if (error) setError(null);
                  }}
                  onBlur={() => {
                    if (!email.trim()) {
                      setLoginEmailError('कृपया आधिकारिक इमेल प्रविष्ट गर्नुहोस्');
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                      setLoginEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा: user@example.com)');
                    }
                  }}
                  placeholder=""
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-[#1E293B] focus:outline-none font-sans ${
                    loginEmailError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                      : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                  }`}
                />
              </div>
              {loginEmailError && (
                <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginEmailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  पासवर्ड (Password)
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-xs font-semibold text-[#176B87] hover:text-[#123B5D] hover:underline cursor-pointer"
                >
                  पासवर्ड बिर्सनुभयो? (Forgot Password?)
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginPasswordError) setLoginPasswordError(null);
                    if (error) setError(null);
                  }}
                  onBlur={() => {
                    if (!password) {
                      setLoginPasswordError('कृपया पासवर्ड प्रविष्ट गर्नुहोस्');
                    }
                  }}
                  placeholder=""
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm text-[#1E293B] focus:outline-none font-sans ${
                    loginPasswordError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                      : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginPasswordError && (
                <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginPasswordError}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>लगइन गरिँदैछ...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          {/* <div className="pt-4 border-t border-[#D8E2E8]/60">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-center mb-2.5">
              द्रुत परीक्षण खाताहरू (Quick Test Accounts)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuickCredentials('nabinaupadhyaya@gmail.com', 'Admin@12345')}
                className="p-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#16803C] flex items-center gap-1">
                  <span>तपाईंको इमेल (Admin)</span>
                </div>
                <div className="text-[10px] text-[#16803C]/80 font-mono mt-0.5 truncate">
                  nabinaupadhyaya@gmail.com
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('admin@insec.org.np', 'Admin@12345')}
                className="p-2 rounded-xl border border-[#123B5D]/20 bg-[#123B5D]/5 hover:bg-[#123B5D]/10 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#123B5D] flex items-center gap-1">
                  <span>प्रशासक (Admin)</span>
                </div>
                <div className="text-[10px] text-[#123B5D]/80 font-mono mt-0.5 truncate">
                  admin@insec.org.np
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('editor@insec.org.np', 'Editor@12345')}
                className="p-2 rounded-xl border border-[#0F766E]/20 bg-[#DFF5F2]/60 hover:bg-[#DFF5F2] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#0F766E] flex items-center gap-1">
                  <span>सम्पादक (Editor)</span>
                </div>
                <div className="text-[10px] text-[#0F766E]/80 font-mono mt-0.5 truncate">
                  editor@insec.org.np
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('user@gmail.com', 'TestPass@123')}
                className="p-2 rounded-xl border border-[#176B87]/20 bg-[#E8F3F6]/70 hover:bg-[#E8F3F6] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#176B87] flex items-center gap-1">
                  <span>दर्शक (Viewer)</span>
                </div>
                <div className="text-[10px] text-[#176B87]/80 font-mono mt-0.5 truncate">
                  user@gmail.com
                </div>
              </button>
            </div>
          </div> */}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FORGOT PASSWORD MODAL (Editor & Viewer)                       */}
      {/* ------------------------------------------------------------- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#D8E2E8] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F4F8FA] border-b border-[#D8E2E8] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8F3F6] text-[#176B87] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#123B5D] text-base">
                  {forgotStep === 'email' && 'पासवर्ड रिसेट गर्नुहोस् (Forgot Password)'}
                  {forgotStep === 'otp' && 'नयाँ पासवर्ड सिर्जना गर्नुहोस् (New Password)'}
                  {forgotStep === 'success' && 'पासवर्ड परिवर्तन सफल (Success)'}
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    forgotFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-[#16803C]'
                      : 'bg-rose-50 border-rose-200 text-[#DC2626]'
                  }`}
                >
                  {forgotFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{forgotFeedback.message}</span>
                </div>
              )}

              {/* STEP 1: Enter Registered Email */}
              {forgotStep === 'email' && (
                <form onSubmit={handleForgotRequestOtp} noValidate className="space-y-4">
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    आफ्नो दर्ता गरिएको आधिकारिक इमेल ठेगाना प्रविष्ट गर्नुहोस्। पासवर्ड रिसेट गर्न ६-अङ्कको एक पटक मात्र प्रयोग हुने सुरक्षा कोड (OTP) पठाइनेछ।
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      दर्ता गरिएको इमेल (Registered Email)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotEmailError) setForgotEmailError(null);
                          if (forgotFeedback) setForgotFeedback(null);
                        }}
                        onBlur={() => {
                          if (!forgotEmail.trim()) {
                            setForgotEmailError('कृपया दर्ता गरिएको आधिकारिक इमेल प्रविष्ट गर्नुहोस्');
                          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
                            setForgotEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्');
                          }
                        }}
                        placeholder="उदा: editor@insec.org.np"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-[#1E293B] focus:outline-none font-sans ${
                          forgotEmailError
                            ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                            : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                        }`}
                      />
                    </div>
                    {forgotEmailError && (
                      <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{forgotEmailError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>अनुरोध गरिँदैछ...</span>
                      </>
                    ) : (
                      <span>सुरक्षा कोड पठाउनुहोस् (Send Reset Code)</span>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP and New Password */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotResetSubmit} noValidate className="space-y-3.5">
                  <div className="bg-[#F4F8FA] p-3 rounded-xl border border-[#D8E2E8] text-xs text-[#64748B] flex items-center justify-between">
                    <div>
                      इमेल: <strong className="text-[#123B5D] font-mono">{forgotEmail}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="text-xs font-semibold text-[#176B87] hover:underline cursor-pointer"
                    >
                      परिवर्तन
                    </button>
                  </div>

                  {/* OTP Code Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1 text-center">
                      ६-अङ्कको सुरक्षा कोड (OTP Code)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => {
                        setForgotOtp(e.target.value.replace(/\D/g, ''));
                        if (forgotOtpError) setForgotOtpError(null);
                      }}
                      placeholder="• • • • • •"
                      className={`w-full text-center tracking-[0.5em] text-2xl font-bold font-mono py-2 rounded-xl border bg-[#F4F8FA] text-[#123B5D] focus:outline-none ${
                        forgotOtpError
                          ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                          : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                      }`}
                    />
                    {forgotOtpError && (
                      <p className="text-[11px] text-[#DC2626] mt-1 text-center flex items-center justify-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{forgotOtpError}</span>
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      नयाँ पासवर्ड (New Password) <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (forgotNewPasswordError) setForgotNewPasswordError(null);
                          if (forgotFeedback) setForgotFeedback(null);
                        }}
                        onBlur={() => {
                          if (!newPassword) {
                            setForgotNewPasswordError('कृपया नयाँ पासवर्ड प्रविष्ट गर्नुहोस्');
                          } else if (newPassword.length < 6) {
                            setForgotNewPasswordError('नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
                          }
                        }}
                        placeholder="कम्तिमा ६ अक्षर"
                        className={`w-full pl-9 pr-10 py-2 rounded-lg border text-sm text-[#1E293B] focus:outline-none font-sans ${
                          forgotNewPasswordError
                            ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                            : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {forgotNewPasswordError && (
                      <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{forgotNewPasswordError}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                      नयाँ पासवर्ड पुष्टि गर्नुहोस् (Confirm Password) <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (forgotConfirmPasswordError) setForgotConfirmPasswordError(null);
                          if (forgotFeedback) setForgotFeedback(null);
                        }}
                        onBlur={() => {
                          if (!confirmPassword) {
                            setForgotConfirmPasswordError('कृपया नयाँ पासवर्ड पुनः प्रविष्ट गर्नुहोस्');
                          } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                            setForgotConfirmPasswordError('दुवै पासवर्ड मिलेनन्। कृपया पुनः जाँच गर्नुहोस्।');
                          }
                        }}
                        placeholder="माथिको पासवर्ड पुनः टाइप गर्नुहोस्"
                        className={`w-full pl-9 pr-10 py-2 rounded-lg border text-sm text-[#1E293B] focus:outline-none font-sans ${
                          forgotConfirmPasswordError
                            ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
                            : 'border-[#D8E2E8] focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {forgotConfirmPasswordError && (
                      <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{forgotConfirmPasswordError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>सुरक्षित गरिँदैछ...</span>
                      </>
                    ) : (
                      <span>पासवर्ड सुरक्षित गर्नुहोस् (Reset Password)</span>
                    )}
                  </button>

                  <div className="pt-2 border-t border-[#D8E2E8]/60 flex items-center justify-between text-xs">
                    <span className="text-[#64748B]">कोड आएन?</span>
                    <button
                      type="button"
                      onClick={handleResendForgotOtp}
                      disabled={forgotLoading || forgotCooldown > 0}
                      className="font-semibold text-[#176B87] hover:text-[#123B5D] hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${forgotLoading ? 'animate-spin' : ''}`} />
                      {forgotCooldown > 0 ? (
                        <span>{forgotCooldown}s पर्खनुहोस्</span>
                      ) : (
                        <span>नयाँ कोड पठाउनुहोस्</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Success Message */}
              {forgotStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#16803C] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#123B5D] text-base">पासवर्ड सफलतापूर्वक परिवर्तन भयो!</h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      तपाईंको नयाँ पासवर्ड सुरक्षित गरिएको छ। अब नयाँ पासवर्ड प्रयोग गरेर लगइन गर्नुहोस्।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(forgotEmail);
                      setPassword('');
                      setShowForgotModal(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    लगइन गर्नुहोस् (Sign In Now)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
