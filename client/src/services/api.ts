/**
 * API Service Client for INSEC Application
 */

import { FilterParams, IncidentRecord, StatsResponse, User, UserAuditLogsResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('insec_token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('insec_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('insec_token', token);
  localStorage.setItem('insec_user', JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('insec_token');
  localStorage.removeItem('insec_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `सर्भरसँग सम्पर्क हुन सकेन (${API_BASE_URL})। ब्याकइन्ड सर्भर सुरु भएको छ कि छैन जाँच गर्नुहोस्। (Backend server is offline or unreachable: ${err?.message || 'Failed to fetch'})`
    );
  }

  // Handle unauthorized / expired token
  if (res.status === 401 && typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/dashboard')) {
      clearAuthSession();
      window.location.href = '/login?expired=1';
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.message || `Request failed with status ${res.status}`);
    error.needsVerification = data.needsVerification;
    error.email = data.email;
    error.expired = data.expired;
    error.status = res.status;
    throw error;
  }

  return data as T;
}

// Public Submission
export async function submitPublicRecord(payload: Partial<IncidentRecord>): Promise<{
  success: boolean;
  message: string;
  record_code: string;
  record_id: number;
}> {
  return request('/public/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Authentication
export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  token: string;
  user: User;
  message: string;
}> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser(): Promise<{ success: boolean; user: User }> {
  return request('/auth/me');
}

// Incident Records (Staff)
export async function fetchRecords(params: FilterParams = {}): Promise<{
  success: boolean;
  data: IncidentRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return request(`/records${qs ? `?${qs}` : ''}`);
}

export async function fetchRecordById(id: number | string): Promise<{
  success: boolean;
  data: IncidentRecord;
}> {
  return request(`/records/${id}`);
}

export async function createStaffRecord(payload: Partial<IncidentRecord>): Promise<{
  success: boolean;
  message: string;
  record_code: string;
  record_id: number;
}> {
  return request('/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIncidentRecord(id: number | string, payload: Partial<IncidentRecord>): Promise<{
  success: boolean;
  message: string;
}> {
  return request(`/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteIncidentRecord(id: number | string): Promise<{
  success: boolean;
  message: string;
}> {
  return request(`/records/${id}`, {
    method: 'DELETE',
  });
}

// Dashboard Statistics
export async function fetchDashboardStats(): Promise<StatsResponse> {
  return request('/dashboard/stats');
}

// Admin Excel Export (Stream download)
export async function downloadExcelExport(params: FilterParams = {}) {
  const token = getStoredToken();
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });

  const url = `${API_BASE_URL}/records/export?${query.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err: any) {
    throw new Error(
      `सर्भरसँग सम्पर्क हुन सकेन। ब्याकइन्ड सर्भर चालु छ कि छैन जाँच गर्नुहोस्। (${err?.message || 'Failed to fetch'})`
    );
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'एक्सेल फाइल डाउनलोड गर्न सकिएन');
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const now = new Date();
  const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
  a.download = `INSEC_Incident_Records_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// User Management (Admin Only)
export async function fetchUsers(): Promise<{ success: boolean; data: User[] }> {
  return request('/users');
}

export async function createStaffUser(payload: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}): Promise<{ success: boolean; message: string; user: User }> {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStaffUser(id: number | string, payload: {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'editor' | 'viewer';
  is_active?: boolean | number;
}): Promise<{ success: boolean; message: string }> {
  return request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStaffUser(id: number | string): Promise<{
  success: boolean;
  message: string;
}> {
  return request(`/users/${id}`, {
    method: 'DELETE',
  });
}

// Email OTP Verification
export async function verifyUserEmail(payload: { email: string; otp: string }): Promise<{
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}> {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendVerificationCode(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  return request('/auth/resend-verification-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Forgot Password Flow (Editor and Viewer)
export async function requestForgotPasswordOtp(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetUserPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// User Audit Logs (Admin Only)
export async function fetchUserAuditLogs(params: {
  search?: string;
  email?: string;
  action?: string;
  role?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
} = {}): Promise<UserAuditLogsResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return request(`/users/audit-logs${qs ? `?${qs}` : ''}`);
}

// Test SMTP Configuration
export async function testSmtpConnection(sendToEmail?: string): Promise<{
  success: boolean;
  status: any;
  sendResult?: any;
}> {
  return request(`/auth/test-smtp${sendToEmail ? `?sendTo=${encodeURIComponent(sendToEmail)}` : ''}`);
}
