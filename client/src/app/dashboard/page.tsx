'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import StatsCards from '@/components/StatsCards';
import FilterBar from '@/components/FilterBar';
import RecordTable from '@/components/RecordTable';
import RecordDetailModal from '@/components/RecordDetailModal';
import DeleteModal from '@/components/DeleteModal';
import {
  getStoredUser,
  getStoredToken,
  fetchRecords,
  fetchDashboardStats,
  deleteIncidentRecord,
  downloadExcelExport,
} from '@/services/api';
import {
  IncidentRecord,
  StatsResponse,
  FilterParams,
  User,
} from '@/types';
import {
  PlusCircle,
  BarChart3,
  FileSpreadsheet,
  AlertCircle,
  Baby,
  Users as UsersIcon,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Stats state
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Records state
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter state
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    district: '',
    municipality: '',
    incident_type: '',
    gender: '',
    is_child: '',
    is_woman: '',
    verification_status: '',
    page: 1,
    limit: 10,
  });

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<IncidentRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<IncidentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Authentication check
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Load Dashboard Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetchDashboardStats();
      if (res.success) {
        setStatsData(res);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Records
  const loadRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      setServerError(null);
      const res = await fetchRecords(filters);
      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load records:', err);
      setServerError(err.message || 'रेकर्डहरू लोड गर्न सकिएन');
    } finally {
      setRecordsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser, loadStats]);

  useEffect(() => {
    if (currentUser) {
      loadRecords();
    }
  }, [currentUser, loadRecords]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      district: '',
      municipality: '',
      incident_type: '',
      gender: '',
      is_child: '',
      is_woman: '',
      verification_status: '',
      page: 1,
      limit: 10,
    });
  };

  // Delete Record (Admin Only)
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setDeleting(true);
      const res = await deleteIncidentRecord(recordToDelete.id);
      setFeedback({ type: 'success', message: res.message || 'रेकर्ड सफलतापूर्वक मेटाइयो' });
      setRecordToDelete(null);
      loadRecords();
      loadStats();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'रेकर्ड मेटाउन सकिएन' });
    } finally {
      setDeleting(false);
    }
  };

  // Export Excel (Admin Only)
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await downloadExcelExport(filters);
      setFeedback({ type: 'success', message: 'एक्सेल फाइल सफलतापूर्वक डाउनलोड भयो' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'एक्सेल निर्यात असफल भयो' });
    } finally {
      setExporting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FA]">
        <div className="inline-block w-8 h-8 border-3 border-[#176B87] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FA]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
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
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              हटाउनुहोस्
            </button>
          </div>
        )}

        {/* Backend Connection Error Banner */}
        {serverError && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-[#DC2626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-sm">{serverError}</p>
                <p className="text-xs text-[#DC2626]/80 mt-0.5">
                  नयाँ टर्मिनल खोली <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold">cd server &amp;&amp; npm run dev</code> चलाई ब्याकइन्ड सर्भर सुरु गर्नुहोस्।
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                loadStats();
                loadRecords();
              }}
              className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              पुनः प्रयास (Retry)
            </button>
          </div>
        )}

        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#123B5D]">
                इन्सेक केन्द्रीय तथ्याङ्क ड्यासबोर्ड
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DFF5F2] text-[#0F766E] border border-[#0F766E]/20">
                Live Data
              </span>
              {currentUser.role === 'viewer' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F3F6] text-[#64748B] border border-[#D8E2E8]">
                  हेर्न मात्र (View Only)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              प्रभावित नागरिक, हताहती तथा खोज/उद्धार सम्बन्धी समग्र अवस्था
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                loadStats();
                loadRecords();
              }}
              title="तथ्याङ्क ताजा गर्नुहोस्"
              className="p-2.5 rounded-xl border border-[#D8E2E8] bg-white hover:bg-[#E8F3F6] text-[#176B87] shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Only editors and admins can add records */}
            {currentUser.role !== 'viewer' && (
              <Link
                href="/dashboard/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>नयाँ रेकर्ड थप्नुहोस् (+ New)</span>
              </Link>
            )}
          </div>
        </div>

        {/* 10 Dynamic Stats Cards */}
        {statsData && (
          <StatsCards stats={statsData.stats} loading={statsLoading} />
        )}

        {/* Vulnerability & District Quick Highlights */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Vulnerability Highlight Card */}
            <div className="bg-gradient-to-r from-[#DFF5F2]/25 via-white to-white rounded-xl border border-[#D8E2E8] border-l-4 border-l-[#0F766E] p-4 shadow-2xs">
              <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-[#0F766E]" />
                  <span>विशेष जोखिममा रहेका समूह (Vulnerability Breakdown)</span>
                </span>
                <span className="text-[10px] font-semibold text-[#0F766E] bg-[#DFF5F2] border border-[#0F766E]/20 px-2 py-0.5 rounded-full">
                  संवेदनशील
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#E8F3F6] border border-[#D8E2E8]">
                  <span className="text-[#64748B] block text-[11px] font-medium">अभिभावक गुमाएका</span>
                  <span className="font-bold text-[#123B5D] text-base mt-0.5 block">
                    {(statsData.charts.vulnerabilities.child_guardian_lost || 0).toLocaleString('ne-NP')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#E8F3F6] border border-[#D8E2E8]">
                  <span className="text-[#64748B] block text-[11px] font-medium">विद्यालय प्रभावित</span>
                  <span className="font-bold text-[#123B5D] text-base mt-0.5 block">
                    {(statsData.charts.vulnerabilities.child_school_affected || 0).toLocaleString('ne-NP')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#DFF5F2]/60 border border-[#D8E2E8]">
                  <span className="text-[#64748B] block text-[11px] font-medium">गर्भवती महिला</span>
                  <span className="font-bold text-[#0F766E] text-base mt-0.5 block">
                    {(statsData.charts.vulnerabilities.pregnant_women || 0).toLocaleString('ne-NP')}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#DFF5F2]/60 border border-[#D8E2E8]">
                  <span className="text-[#64748B] block text-[11px] font-medium">एकल महिला</span>
                  <span className="font-bold text-[#0F766E] text-base mt-0.5 block">
                    {(statsData.charts.vulnerabilities.single_women || 0).toLocaleString('ne-NP')}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Districts */}
            <div className="bg-white rounded-xl border border-[#D8E2E8] p-4 shadow-xs">
              <h2 className="text-xs font-bold text-[#123B5D] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#176B87]" />
                <span>धेरै घटना दर्ता भएका जिल्लाहरू (Top Districts)</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {statsData.charts.byDistrict.slice(0, 6).map((d) => (
                  <button
                    key={d.district}
                    onClick={() => setFilters({ ...filters, district: d.district, page: 1 })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-[#E8F3F6] border border-[#D8E2E8] hover:border-[#176B87] text-xs text-[#1E293B] transition-colors cursor-pointer"
                  >
                    <span className="font-semibold">{d.district}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#DFF5F2] text-[#0F766E] text-[10px] font-bold">
                      {d.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Filter Controls Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          onReset={handleResetFilters}
          userRole={currentUser.role}
          onExportExcel={currentUser.role === 'admin' ? handleExportExcel : undefined}
          exporting={exporting}
        />

        {/* Incident Records Table */}
        <RecordTable
          records={records}
          loading={recordsLoading}
          userRole={currentUser.role}
          onViewDetails={(rec) => setSelectedRecord(rec)}
          onDeleteRecord={currentUser.role !== 'viewer' ? (rec) => setRecordToDelete(rec) : undefined}
          pagination={pagination}
          onPageChange={(p) => setFilters({ ...filters, page: p })}
        />

      </main>

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Delete Confirmation Modal (Admin Only) */}
      <DeleteModal
        record={recordToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
        deleting={deleting}
      />
    </div>
  );
}
