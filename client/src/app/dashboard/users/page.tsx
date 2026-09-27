'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  fetchUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  fetchUserAuditLogs,
  getStoredUser,
  getStoredToken,
} from '@/services/api';
import { User, UserAuditLog } from '@/types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Trash2,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function UsersManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Tab View: 'users' or 'audit_logs'
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs'>('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLimit] = useState(15);

  // Audit Log Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formRole, setFormRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [formActive, setFormActive] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Inline Validation Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'प्रयोगकर्ता सूची लोड गर्न सकिएन' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async (pageToLoad = auditPage) => {
    try {
      setAuditLoading(true);
      const res = await fetchUserAuditLogs({
        page: pageToLoad,
        limit: auditLimit,
        search: filterSearch.trim() || undefined,
        action: filterAction !== 'all' ? filterAction : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      });

      if (res.success) {
        setAuditLogs(res.data);
        setAuditTotal(res.pagination.total);
        setAuditPage(res.pagination.page);
        setAuditTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'अडिट लग लोड गर्न सकिएन' });
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditLimit, filterSearch, filterAction, filterRole, filterDateFrom, filterDateTo]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadAuditLogs(1);
      }
    }
  }, [currentUser, activeTab, loadUsers, loadAuditLogs]);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setFeedback(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasErr = false;

    if (!formName.trim()) {
      setNameError('कृपया पुरा नाम प्रविष्ट गर्नुहोस्');
      hasErr = true;
    }

    if (!formEmail.trim()) {
      setEmailError('कृपया इमेल ठेगाना प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (!emailRegex.test(formEmail.trim())) {
      setEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा: user@example.com)');
      hasErr = true;
    }

    if (!formPassword) {
      setPasswordError('कृपया पासवर्ड प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (formPassword.length < 6) {
      setPasswordError('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
      hasErr = true;
    }

    if (hasErr) return;

    try {
      setActionLoading(true);
      const res = await createStaffUser({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'नयाँ प्रयोगकर्ता खाता सफलतापूर्वक सिर्जना गरियो।',
        });
        setShowAddModal(false);
        resetForm();
        loadUsers();
      }
    } catch (err: any) {
      const msg = err.message || 'प्रयोगकर्ता सिर्जना गर्न सकिएन';
      if (msg.includes('इमेल') || msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else if (msg.includes('पासवर्ड') || msg.toLowerCase().includes('password')) {
        setPasswordError(msg);
      } else {
        setModalError(msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setFeedback(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasErr = false;

    if (!formName.trim()) {
      setNameError('कृपया पुरा नाम प्रविष्ट गर्नुहोस्');
      hasErr = true;
    }

    if (!formEmail.trim()) {
      setEmailError('कृपया इमेल ठेगाना प्रविष्ट गर्नुहोस्');
      hasErr = true;
    } else if (!emailRegex.test(formEmail.trim())) {
      setEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा: user@example.com)');
      hasErr = true;
    }

    if (formPassword && formPassword.length < 6) {
      setPasswordError('नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
      hasErr = true;
    }

    if (hasErr) return;

    try {
      setActionLoading(true);
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        is_active: formActive ? 1 : 0,
      };
      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      const res = await updateStaffUser(editingUser.id, payload);
      if (res.success) {
        setFeedback({ type: 'success', message: 'प्रयोगकर्ता विवरण अद्यावधिक भयो' });
        setEditingUser(null);
        resetForm();
        loadUsers();
      }
    } catch (err: any) {
      const msg = err.message || 'अपडेट गर्न सकिएन';
      if (msg.includes('इमेल') || msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else if (msg.includes('पासवर्ड') || msg.toLowerCase().includes('password')) {
        setPasswordError(msg);
      } else {
        setModalError(msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(true);
      const res = await deleteStaffUser(userToDelete.id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'प्रयोगकर्ता मेटाइयो र अडिट लग सुरक्षित गरियो',
        });
        setUserToDelete(null);
        loadUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'मेटाउन सकिएन' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormActive(Boolean(u.is_active));
    setFormPassword('');
    setShowFormPassword(false);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setModalError(null);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowFormPassword(false);
    setFormRole('editor');
    setFormActive(true);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setModalError(null);
  };

  const resetAuditFilters = () => {
    setFilterSearch('');
    setFilterAction('all');
    setFilterRole('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setAuditPage(1);
    loadAuditLogs(1);
  };

  if (!currentUser) return null;

  // Role Protection: Admin Only
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F8FA]">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#123B5D]">पहुँच अस्वीकृत (Permission Denied)</h1>
          <p className="text-sm text-[#64748B] mt-2">
            यो पृष्ठ केवल केन्द्रीय प्रशासक (Admin) का लागि मात्र सुरक्षित गरिएको छ।
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#176B87] text-white rounded-xl text-sm font-semibold hover:bg-[#123B5D]"
            >
              ड्यासबोर्डमा फर्कनुहोस्
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Helper for audit action badges
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Account Created':
        return 'bg-emerald-50 text-[#16803C] border-emerald-200';
      case 'Account Deleted':
        return 'bg-rose-50 text-[#DC2626] border-rose-200';
      case 'Password Reset Requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Password Successfully Changed':
        return 'bg-sky-50 text-[#176B87] border-sky-200';
      case 'Account Role Changed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-[#E8F3F6] text-[#123B5D] border-[#D8E2E8]';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FA]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#176B87] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ड्यासबोर्डमा फर्कनुहोस्</span>
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#16803C]'
                : 'bg-rose-50 border-rose-200 text-[#DC2626]'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#16803C]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#DC2626]" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold underline cursor-pointer">
              हटाउनुहोस्
            </button>
          </div>
        )}

        {/* Header & Tabs */}
        <div className="bg-white p-6 rounded-2xl border border-[#D8E2E8] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#DFF5F2] text-[#0F766E] flex items-center justify-center shrink-0">
                {activeTab === 'users' ? <Users className="w-6 h-6" /> : <History className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#123B5D]">
                  {activeTab === 'users'
                    ? 'कर्मचारी प्रयोगकर्ता व्यवस्थापन (User Management)'
                    : 'प्रयोगकर्ता अडिट लग (User Audit Logs)'}
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {activeTab === 'users'
                    ? 'इन्सेक केन्द्रीय प्रशासक, सम्पादक तथा दर्शक खाताहरूको व्यवस्थापन'
                    : 'खाता सिर्जना, मेटाउने, पासवर्ड रिसेट तथा भूमिका परिवर्तन गतिविधिको पूर्ण अभिलेख'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Tab Switcher Buttons */}
              <div className="flex items-center bg-[#F4F8FA] p-1 rounded-xl border border-[#D8E2E8]">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'users'
                      ? 'bg-white text-[#123B5D] shadow-xs'
                      : 'text-[#64748B] hover:text-[#123B5D]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>प्रयोगकर्ता सूची</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit_logs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'audit_logs'
                      ? 'bg-white text-[#176B87] shadow-xs'
                      : 'text-[#64748B] hover:text-[#176B87]'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>अडिट लग (Audit Logs)</span>
                </button>
              </div>

              {activeTab === 'users' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>नयाँ प्रयोगकर्ता थप्नुहोस्</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: USERS LIST VIEW                                      */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-[#176B87] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">प्रयोगकर्ता सूची लोड हुँदैछ...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#F4F8FA] border-b border-[#D8E2E8] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">नाम</th>
                      <th className="py-3 px-4">इमेल</th>
                      <th className="py-3 px-4">भूमिका (Role)</th>
                      <th className="py-3 px-4">स्थिति (Status)</th>
                      <th className="py-3 px-4 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8E2E8]/60">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#E8F3F6]/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#123B5D]">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DFF5F2] text-[#0F766E] border border-[#0F766E]/20">
                                तपाईं (You)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#64748B]">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                u.role === 'admin'
                                  ? 'bg-[#123B5D]/10 text-[#123B5D] border-[#123B5D]/20'
                                  : u.role === 'editor'
                                  ? 'bg-[#DFF5F2] text-[#0F766E] border-[#0F766E]/20'
                                  : 'bg-[#E8F3F6] text-[#64748B] border-[#D8E2E8]'
                              }`}
                            >
                              {u.role === 'admin'
                                ? 'प्रशासक (Admin)'
                                : u.role === 'editor'
                                ? 'सम्पादक (Editor)'
                                : 'दर्शक (Viewer)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                Boolean(u.is_active)
                                  ? 'bg-emerald-50 text-[#16803C] border border-emerald-200'
                                  : 'bg-rose-50 text-[#DC2626] border border-rose-200'
                              }`}
                            >
                              {Boolean(u.is_active) ? 'सक्रिय' : 'निष्क्रिय'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#176B87] hover:bg-[#E8F3F6] transition-colors cursor-pointer"
                                title="सम्पादन तथा पासवर्ड परिवर्तन"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="खाता मेटाउनुहोस्"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: AUDIT LOGS VIEW                                      */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#D8E2E8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#123B5D]">
                  <Filter className="w-4 h-4 text-[#176B87]" />
                  <span>फिल्टर तथा खोज (Filter & Search)</span>
                </div>
                <button
                  type="button"
                  onClick={resetAuditFilters}
                  className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#123B5D] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>रिसेट गर्नुहोस्</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="प्रयोगकर्ता, इमेल, विवरण खोज्नुहोस्..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D8E2E8] bg-[#F4F8FA] focus:bg-white text-xs text-[#1E293B] focus:outline-none focus:border-[#176B87]"
                  />
                </div>

                {/* Filter Action */}
                <div>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8E2E8] bg-[#F4F8FA] text-xs text-[#1E293B] focus:outline-none focus:border-[#176B87]"
                  >
                    <option value="all">सबै कार्य (All Actions)</option>
                    <option value="Account Created">Account Created</option>
                    <option value="Account Deleted">Account Deleted</option>
                    <option value="Password Reset Requested">Password Reset Requested</option>
                    <option value="Password Successfully Changed">Password Successfully Changed</option>
                    <option value="Account Role Changed">Account Role Changed</option>
                    <option value="Account Updated">Account Updated</option>
                  </select>
                </div>

                {/* Filter Role */}
                <div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8E2E8] bg-[#F4F8FA] text-xs text-[#1E293B] focus:outline-none focus:border-[#176B87]"
                  >
                    <option value="all">सबै भूमिका (All Roles)</option>
                    <option value="admin">प्रशासक (Admin)</option>
                    <option value="editor">सम्पादक (Editor)</option>
                    <option value="viewer">दर्शक (Viewer)</option>
                  </select>
                </div>

                {/* Submit Filter Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuditPage(1);
                      loadAuditLogs(1);
                    }}
                    className="w-full py-2 bg-[#176B87] hover:bg-[#123B5D] text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>खोज्नुहोस्</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
              {auditLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-[#176B87] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#64748B]">अडिट लग लोड हुँदैछ...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <History className="w-10 h-10 text-[#64748B]/40 mx-auto" />
                  <p className="text-sm font-semibold text-[#123B5D]">कुनै अडिट लग फेला परेन</p>
                  <p className="text-xs text-[#64748B]">फिल्टर सर्तहरू परिवर्तन गरेर पुनः प्रयास गर्नुहोस्।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F4F8FA] border-b border-[#D8E2E8] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">मिति र समय</th>
                        <th className="py-3 px-4">कार्य (Action)</th>
                        <th className="py-3 px-4">प्रभावित प्रयोगकर्ता</th>
                        <th className="py-3 px-4">भूमिका</th>
                        <th className="py-3 px-4">विवरण (Description)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8E2E8]/60">
                      {auditLogs.map((log) => {
                        const dateFormatted = new Date(log.created_at).toLocaleString('ne-NP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });
                        return (
                          <tr key={log.id} className="hover:bg-[#E8F3F6]/40 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-[#64748B] font-mono text-[11px]">
                              {dateFormatted}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getActionBadge(
                                  log.action
                                )}`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#1E293B]">{log.affected_user_name}</div>
                              <div className="text-[11px] text-[#64748B] font-mono">{log.affected_user_email}</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="capitalize px-2 py-0.5 rounded bg-[#F4F8FA] border border-[#D8E2E8] font-bold text-[10px] text-[#123B5D]">
                                {log.affected_user_role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#64748B] text-xs max-w-xs break-words">
                              {log.description || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {auditTotalPages > 1 && (
                <div className="p-4 border-t border-[#D8E2E8] bg-[#F4F8FA] flex items-center justify-between text-xs text-[#64748B]">
                  <div>
                    कुल <strong>{auditTotal}</strong> अभिलेखहरू (पृष्ठ {auditPage} / {auditTotalPages})
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={auditPage <= 1 || auditLoading}
                      onClick={() => {
                        const prev = auditPage - 1;
                        setAuditPage(prev);
                        loadAuditLogs(prev);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D8E2E8] bg-white hover:bg-[#E8F3F6] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>अघिल्लो</span>
                    </button>
                    <button
                      type="button"
                      disabled={auditPage >= auditTotalPages || auditLoading}
                      onClick={() => {
                        const next = auditPage + 1;
                        setAuditPage(next);
                        loadAuditLogs(next);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D8E2E8] bg-white hover:bg-[#E8F3F6] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <span>पछिल्लो</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit User Modal                                      */}
      {/* ------------------------------------------------------------- */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#D8E2E8] overflow-hidden">
            <div className="px-6 py-4 bg-[#F4F8FA] border-b border-[#D8E2E8] flex items-center justify-between">
              <h3 className="font-bold text-[#123B5D] text-base">
                {editingUser ? 'प्रयोगकर्ता विवरण सम्पादन / पासवर्ड परिवर्तन' : 'नयाँ कर्मचारी खाता सिर्जना'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleEditSubmit : handleAddSubmit} noValidate className="p-6 space-y-4 text-sm">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[#DC2626] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  पुरा नाम (Full Name) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (nameError) setNameError(null);
                    if (modalError) setModalError(null);
                  }}
                  onBlur={() => {
                    if (!formName.trim()) {
                      setNameError('कृपया पुरा नाम प्रविष्ट गर्नुहोस्');
                    }
                  }}
                  placeholder=""
                  className={`form-input ${nameError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : ''}`}
                />
                {nameError && (
                  <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  इमेल (Email) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => {
                    setFormEmail(e.target.value);
                    if (emailError) setEmailError(null);
                    if (modalError) setModalError(null);
                  }}
                  onBlur={() => {
                    if (!formEmail.trim()) {
                      setEmailError('कृपया इमेल ठेगाना प्रविष्ट गर्नुहोस्');
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
                      setEmailError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (उदा: user@example.com)');
                    }
                  }}
                  placeholder=""
                  className={`form-input font-mono ${emailError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : ''}`}
                />
                {emailError && (
                  <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  {editingUser
                    ? 'नयाँ पासवर्ड (परिवर्तन गर्न चाहेमा मात्र प्रविष्ट गर्नुहोस्)'
                    : 'पासवर्ड (Password) *'}
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => {
                      setFormPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                      if (modalError) setModalError(null);
                    }}
                    onBlur={() => {
                      if (!editingUser && !formPassword) {
                        setPasswordError('कृपया पासवर्ड प्रविष्ट गर्नुहोस्');
                      } else if (formPassword && formPassword.length < 6) {
                        setPasswordError('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ');
                      }
                    }}
                    placeholder={editingUser ? 'यथावत राख्न खाली छोड्नुहोस्' : ''}
                    className={`form-input font-mono pr-10 ${passwordError ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                    tabIndex={-1}
                    title={showFormPassword ? 'पासवर्ड लुकाउनुहोस्' : 'पासवर्ड हेर्नुहोस्'}
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-[#DC2626] mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  भूमिका (Role) <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  className="form-select font-semibold"
                >
                  <option value="viewer">दर्शक (Viewer)</option>
                  <option value="editor">तथ्याङ्क सम्पादक (Editor)</option>
                  <option value="admin">केन्द्रीय प्रशासक (Admin)</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#1E293B] cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 text-[#176B87] accent-[#176B87] rounded"
                    />
                    <span>सक्रिय खाता (Active Account)</span>
                  </label>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#D8E2E8]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#E8F3F6] rounded-lg cursor-pointer"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#123B5D] rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingUser ? 'अपडेट गर्नुहोस्' : 'खाता सिर्जना गर्नुहोस्'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Delete User Confirmation Modal                                */}
      {/* ------------------------------------------------------------- */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#D8E2E8] overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-[#123B5D] text-base">खाता मेटाउने निश्चित हुनुहुन्छ?</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                प्रयोगकर्ता <strong className="text-[#1E293B]">{userToDelete.name}</strong> ({userToDelete.email}) लाई स्थायी रूपमा हटाइनेछ।
                <br />
                <span className="text-[11px] text-[#0F766E] font-medium">
                  (अडिट लगमा कुन समयमा कुन खाता हटाइयो भन्ने इतिहास सुरक्षित रहनेछ)
                </span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] bg-[#E8F3F6] hover:bg-[#D8E2E8] rounded-lg cursor-pointer"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 rounded-lg shadow-xs cursor-pointer"
              >
                {actionLoading ? 'मेटाउँदै...' : 'मेटाउनुहोस्'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
