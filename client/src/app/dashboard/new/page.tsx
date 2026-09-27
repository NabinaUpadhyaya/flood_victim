'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import IncidentForm from '@/components/IncidentForm';
import { createStaffRecord, getStoredToken, getStoredUser } from '@/services/api';
import { IncidentRecord } from '@/types';
import { ArrowLeft, PlusCircle, ShieldAlert } from 'lucide-react';

export default function NewRecordPage() {
  const router = useRouter();
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
    // Viewers cannot create records — redirect immediately
    if (user.role === 'viewer') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (formData: Partial<IncidentRecord>) => {
    try {
      setLoading(true);
      setError(null);
      const res = await createStaffRecord(formData);
      if (res.success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'रेकर्ड सिर्जना गर्न सकिएन');
    } finally {
      setLoading(false);
    }
  };

  // Block render until role is confirmed (prevents flash of form for viewers)
  if (!role || role === 'viewer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FA]">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
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

        {/* Page Title */}
        <div className="bg-white rounded-2xl border border-[#D8E2E8] p-6 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DFF5F2] text-[#0F766E] flex items-center justify-center shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#123B5D]">
              नयाँ घटना तथा प्रभावित व्यक्ति विवरण प्रविष्टि
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              इन्सेकको आधिकारिक फारम अनुसार नयाँ रेकर्ड सिर्जना गर्नुहोस्
            </p>
          </div>
        </div>

        {/* The Form */}
        <IncidentForm
          onSubmit={handleSubmit}
          isStaff={true}
          isEdit={false}
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
}
