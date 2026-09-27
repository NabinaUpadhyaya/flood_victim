'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import IncidentForm from '@/components/IncidentForm';
import { fetchRecordById, updateIncidentRecord, getStoredToken, getStoredUser } from '@/services/api';
import { IncidentRecord } from '@/types';
import { ArrowLeft, Edit3, Loader2, ShieldAlert } from 'lucide-react';

export default function EditRecordPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<IncidentRecord | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (!token || !user) {
      router.push('/login');
      return;
    }

    setRole(user.role);

    // Viewers cannot edit records — redirect back to dashboard
    if (user.role === 'viewer') {
      router.replace('/dashboard');
      return;
    }

    async function loadRecord() {
      try {
        setFetching(true);
        const res = await fetchRecordById(id);
        if (res.success && res.data) {
          setInitialData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'रेकर्ड फेला परेन');
      } finally {
        setFetching(false);
      }
    }

    if (id) {
      loadRecord();
    }
  }, [id, router]);

  const handleSubmit = async (formData: Partial<IncidentRecord>) => {
    try {
      setLoading(true);
      setError(null);
      const res = await updateIncidentRecord(id, formData);
      if (res.success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'रेकर्ड अद्यावधिक गर्न सकिएन');
    } finally {
      setLoading(false);
    }
  };

  // Block render for viewers while redirect is happening
  if (!role || role === 'viewer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FA]">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-[#D97706] mx-auto" />
          <p className="text-sm text-[#64748B]">पहुँच अस्वीकृत — पुनःनिर्देशन हुँदैछ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FA]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#176B87] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ड्यासबोर्डमा फर्कनुहोस्</span>
          </Link>
        </div>

        {fetching ? (
          <div className="bg-white rounded-2xl border border-[#D8E2E8] p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#176B87] animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#64748B] font-medium">रेकर्ड लोड हुँदैछ...</p>
          </div>
        ) : initialData ? (
          <>
            {/* Page Title */}
            <div className="bg-white rounded-2xl border border-[#D8E2E8] p-6 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DFF5F2] text-[#0F766E] flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#123B5D]">
                      रेकर्ड सम्पादन (Edit Record)
                    </h1>
                    <span className="px-2 py-0.5 font-mono text-xs font-bold rounded-md bg-[#E8F3F6] text-[#176B87] border border-[#D8E2E8]">
                      {initialData.record_code}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    प्रभावित: {initialData.full_name} | {initialData.district}
                  </p>
                </div>
              </div>
            </div>

            {/* The Form with Pre-filled Data */}
            <IncidentForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isStaff={true}
              isEdit={true}
              loading={loading}
              error={error}
            />
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-[#DC2626]">
            {error || 'रेकर्ड फेला परेन'}
          </div>
        )}
      </main>
    </div>
  );
}
