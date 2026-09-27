'use client';

import React from 'react';
import { Search, RotateCcw, FileSpreadsheet, Loader2 } from 'lucide-react';
import { FilterParams, UserRole } from '@/types';
import { NEPAL_DISTRICTS, INCIDENT_TYPES, GENDER_OPTIONS } from '@/services/nepalData';

interface FilterBarProps {
  filters: FilterParams;
  onFilterChange: (newFilters: FilterParams) => void;
  onReset: () => void;
  userRole?: UserRole | null;
  onExportExcel?: () => void;
  exporting?: boolean;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onReset,
  userRole,
  onExportExcel,
  exporting = false,
}: FilterBarProps) {
  const handleChange = (key: keyof FilterParams, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
      page: 1, // Reset page on filter change
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.district ||
    filters.incident_type ||
    filters.gender ||
    filters.is_child ||
    filters.is_woman ||
    filters.verification_status
  );

  return (
    <div className="bg-white rounded-xl border border-[#D8E2E8] p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="नाम, दर्ता कोड (e.g. INSEC-2026-0001), फोन, ठेगाना खोज्नुहोस्..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D8E2E8] text-sm text-[#1E293B] bg-[#F4F8FA]/70 focus:bg-white focus:outline-none focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/20 transition-all placeholder:text-[#64748B]/60"
          />
        </div>

        {/* Action Buttons: Export (Admin only) & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] bg-[#E8F3F6] hover:bg-[#D8E2E8] rounded-lg transition-colors cursor-pointer"
              title="सबै फिल्टरहरू हटाउनुहोस्"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रिसेट</span>
            </button>
          )}

          {userRole === 'admin' && onExportExcel && (
            <button
              onClick={onExportExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#16803C] hover:bg-[#136e34] active:bg-[#0f5629] disabled:bg-[#16803C]/50 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
              title="हालको फिल्टर गरिएको तथ्याङ्क एक्सेल (.xlsx) मा डाउनलोड गर्नुहोस्"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>तयार गरिँदैछ...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>एक्सेल निर्यात (Export Excel)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Second row: Dropdown and toggle filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#D8E2E8]/60 text-xs">
        {/* District Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            जिल्ला (District)
          </label>
          <select
            value={filters.district || ''}
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै जिल्लाहरू</option>
            {NEPAL_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Incident Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            घटनाको प्रकार
          </label>
          <select
            value={filters.incident_type || ''}
            onChange={(e) => handleChange('incident_type', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै घटना प्रकार</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            लिङ्ग (Gender)
          </label>
          <select
            value={filters.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै लिङ्ग</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            सत्यापन (Verification)
          </label>
          <select
            value={filters.verification_status || ''}
            onChange={(e) => handleChange('verification_status', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै अवस्था</option>
            <option value="verified">प्रमाणीत (Verified)</option>
            <option value="pending">हुन बाँकी (Pending)</option>
          </select>
        </div>

        {/* Children Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            बालबालिका (Children)
          </label>
          <select
            value={filters.is_child || ''}
            onChange={(e) => handleChange('is_child', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै उमेर समूह</option>
            <option value="1">बालबालिका मात्र</option>
          </select>
        </div>

        {/* Women Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            महिला (Women)
          </label>
          <select
            value={filters.is_woman || ''}
            onChange={(e) => handleChange('is_woman', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-[#D8E2E8] bg-white text-[#1E293B] focus:outline-none focus:border-[#176B87] font-medium"
          >
            <option value="">सबै</option>
            <option value="1">महिला मात्र</option>
          </select>
        </div>
      </div>
    </div>
  );
}
