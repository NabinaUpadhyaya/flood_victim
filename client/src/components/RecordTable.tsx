'use client';

import React from 'react';
import Link from 'next/link';
import {
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Baby,
  Users,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { IncidentRecord, UserRole } from '@/types';
import {
  getIncidentLabel,
  getGenderLabel,
  getVerificationBadge,
} from '@/services/nepalData';

interface RecordTableProps {
  records: IncidentRecord[];
  loading: boolean;
  userRole?: UserRole | null;
  onViewDetails: (record: IncidentRecord) => void;
  onDeleteRecord?: (record: IncidentRecord) => void;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (newPage: number) => void;
}

export default function RecordTable({
  records,
  loading,
  userRole,
  onViewDetails,
  onDeleteRecord,
  pagination,
  onPageChange,
}: RecordTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#D8E2E8] overflow-hidden shadow-xs">
        <div className="p-8 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-3 border-[#176B87] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#64748B]">तथ्याङ्क लोड हुँदैछ, कृपया प्रतिक्षा गर्नुहोस्...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D8E2E8] p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#E8F3F6] text-[#64748B] flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#1E293B]">कुनै तथ्याङ्क फेला परेन</h3>
        <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
          खोजिएका मापदण्डहरू अनुसार कुनै रेकर्ड भेटिएन। कृपया फरक शब्द वा फिल्टर चयन गरी पुनः प्रयास गर्नुहोस्।
        </p>
      </div>
    );
  }

  const getIncidentBadgeColor = (type: string) => {
    switch (type) {
      case 'death':
        return 'bg-rose-50 text-[#DC2626] border-rose-200';
      case 'missing':
        return 'bg-sky-50 text-[#0284C7] border-sky-200';
      case 'injured':
        return 'bg-amber-50 text-[#D97706] border-amber-200';
      case 'disabled':
        return 'bg-amber-50 text-[#D97706] border-amber-200';
      default:
        return 'bg-slate-50 text-[#64748B] border-[#D8E2E8]';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#D8E2E8] overflow-hidden shadow-xs flex flex-col">
      {/* Table container with horizontal scroll for responsiveness */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#F4F8FA] border-b border-[#D8E2E8] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">दर्ता कोड</th>
              <th className="py-3 px-4">प्रभावितको नाम, थर</th>
              <th className="py-3 px-4">जिल्ला / ठेगाना</th>
              <th className="py-3 px-4">उमेर / लिङ्ग</th>
              <th className="py-3 px-4">घटनाको प्रकार</th>
              <th className="py-3 px-4">विशेष अवस्था</th>
              <th className="py-3 px-4">सत्यापन</th>
              <th className="py-3 px-4 text-right">कार्य (Action)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8E2E8]/60 font-sans">
            {records.map((rec) => {
              const vBadge = getVerificationBadge(rec.verification_status);

              return (
                <tr
                  key={rec.id}
                  className="hover:bg-[#E8F3F6] transition-colors group"
                >
                  {/* Record Code & Collection Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-[#176B87] block">
                      {rec.record_code}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      {rec.collection_date}
                    </span>
                  </td>

                  {/* Person Name */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#1E293B] block group-hover:text-[#176B87] transition-colors">
                      {rec.full_name}
                    </span>
                    {rec.phone && (
                      <span className="text-[11px] text-[#64748B] font-mono">
                        {rec.phone}
                      </span>
                    )}
                  </td>

                  {/* District & Municipality */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-[#1E293B] block">
                      {rec.district}
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      {rec.municipality} {rec.ward_number ? `(${rec.ward_number})` : ''}
                    </span>
                  </td>

                  {/* Age & Gender */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-[#1E293B]">
                      {rec.age != null ? `${rec.age} वर्ष` : '-'}
                    </span>
                    <span className="text-[#64748B] mx-1">/</span>
                    <span className="text-[#64748B]">
                      {getGenderLabel(rec.gender)}
                    </span>
                  </td>

                  {/* Incident Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getIncidentBadgeColor(
                        rec.incident_type
                      )}`}
                    >
                      {getIncidentLabel(rec.incident_type)}
                    </span>
                  </td>

                  {/* Special Flags (Child / Woman / Unidentified) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Boolean(rec.is_child) && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#E8F3F6] text-[#176B87] border border-[#D8E2E8] text-[10px] font-bold"
                          title="बालबालिका"
                        >
                          <Baby className="w-3 h-3" />
                          बालबालिका
                        </span>
                      )}
                      {Boolean(rec.is_woman) && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#DFF5F2] text-[#0F766E] border border-[#0F766E]/20 text-[10px] font-bold"
                          title="महिला"
                        >
                          <Users className="w-3 h-3" />
                          महिला
                        </span>
                      )}
                      {rec.identified === 'no' && (
                        <span className="px-1.5 py-0.5 rounded bg-[#F4F8FA] text-[#64748B] border border-[#D8E2E8] text-[10px] font-bold">
                          सनाखत बाँकी
                        </span>
                      )}
                      {!rec.is_child && !rec.is_woman && rec.identified !== 'no' && (
                        <span className="text-[#64748B] text-xs">-</span>
                      )}
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${vBadge.class}`}
                    >
                      {rec.verification_status === 'verified' ? (
                        <ShieldCheck className="w-3 h-3 text-[#16803C]" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-[#D97706]" />
                      )}
                      {rec.verification_status === 'verified' ? 'प्रमाणीत' : 'बाँकी'}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => onViewDetails(rec)}
                        className="p-1.5 rounded-lg text-[#176B87] hover:text-[#123B5D] hover:bg-[#E8F3F6] transition-colors cursor-pointer"
                        title="विस्तृत विवरण हेर्नुहोस्"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {userRole !== 'viewer' && (
                        <Link
                          href={`/dashboard/${rec.id}/edit`}
                          className="p-1.5 rounded-lg text-[#0F766E] hover:text-[#0a524c] hover:bg-[#DFF5F2] transition-colors"
                          title="सम्पादन गर्नुहोस्"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Delete Record - Admin Only */}
                      {userRole === 'admin' && onDeleteRecord && (
                        <button
                          onClick={() => onDeleteRecord(rec)}
                          className="p-1.5 rounded-lg text-[#DC2626] hover:text-[#b91c1c] hover:bg-rose-50 transition-colors cursor-pointer"
                          title="रेकर्ड मेटाउनुहोस् (Admin only)"
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

      {/* Pagination Controls */}
      <div className="px-4 py-3 bg-[#F4F8FA] border-t border-[#D8E2E8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-[#64748B]">
          जम्मा <span className="font-bold text-[#1E293B]">{pagination.total}</span> मध्ये{' '}
          <span className="font-semibold text-[#1E293B]">
            {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{' '}
          रेकर्डहरू देखाइएको छ
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#D8E2E8] bg-white font-semibold text-[#1E293B] hover:bg-[#E8F3F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>अघिल्लो</span>
          </button>

          <span className="px-2 font-medium text-[#64748B]">
            पृष्ठ {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#D8E2E8] bg-white font-semibold text-[#1E293B] hover:bg-[#E8F3F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>पछिल्लो</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
