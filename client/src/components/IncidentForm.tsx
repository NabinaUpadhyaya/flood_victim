'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  User,
  AlertCircle,
  Activity,
  Users,
  CheckCircle,
  HelpCircle,
  Loader2,
  Calendar,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { IncidentRecord } from '@/types';
import {
  INCIDENT_TYPES,
  GENDER_OPTIONS,
  SEARCH_STATUS_OPTIONS,
  CONDITION_OPTIONS,
} from '@/services/nepalData';
import {
  getDistricts,
  getMunicipalities,
  getWards,
} from '@/services/nepalGeoData';

const getTodayStr = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const MONTH_NAMES = [
  'January (जनवरी)',
  'February (फेब्रुअरी)',
  'March (मार्च)',
  'April (अप्रिल)',
  'May (मे)',
  'June (जुन)',
  'July (जुलाई)',
  'August (अगस्ट)',
  'September (सेप्टेम्बर)',
  'October (अक्टोबर)',
  'November (नोभेम्बर)',
  'December (डिसेम्बर)',
];

const WEEK_DAYS = ['आई', 'सोम', 'मंग', 'बुध', 'बिही', 'शुक्र', 'शनि'];

interface DatePickerProps {
  name: string;
  value?: string;
  onChange: (name: string, value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxDate?: string;
  minDate?: string;
  readOnly?: boolean;
}

function DatePicker({
  name,
  value,
  onChange,
  hasError = false,
  disabled = false,
  placeholder = 'YYYY-MM-DD',
  maxDate,
  minDate,
  readOnly = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayStr();
  const effectiveMaxDate = maxDate || todayStr;
  const effectiveMinDate = minDate;

  const maxYear = parseInt(effectiveMaxDate.split('-')[0], 10);
  const maxMonth = parseInt(effectiveMaxDate.split('-')[1], 10) - 1;

  const minYear = effectiveMinDate ? parseInt(effectiveMinDate.split('-')[0], 10) : 1950;
  const minMonth = effectiveMinDate ? parseInt(effectiveMinDate.split('-')[1], 10) - 1 : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const parseInitialDate = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-');
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1,
      };
    }
    return {
      year: parseInt(todayStr.split('-')[0], 10),
      month: parseInt(todayStr.split('-')[1], 10) - 1,
    };
  };

  const initial = parseInitialDate();
  const [viewYear, setViewYear] = useState<number>(initial.year);
  const [viewMonth, setViewMonth] = useState<number>(initial.month);

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const popoverHeight = 360;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = rect.bottom + 6;
    if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
      top = Math.max(10, rect.top - popoverHeight - 6);
    }

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setPopoverCoords({
      top,
      left,
      width: popoverWidth,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const canGoPrevMonth = !(effectiveMinDate && (viewYear < minYear || (viewYear === minYear && viewMonth <= minMonth)));
  const canGoNextMonth = !(viewYear > maxYear || (viewYear === maxYear && viewMonth >= maxMonth));

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewYear(newYear);
    if (newYear === maxYear && viewMonth > maxMonth) {
      setViewMonth(maxMonth);
    }
    if (effectiveMinDate && newYear === minYear && viewMonth < minMonth) {
      setViewMonth(minMonth);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    if (viewYear === maxYear && newMonth > maxMonth) {
      return;
    }
    if (effectiveMinDate && viewYear === minYear && newMonth < minMonth) {
      return;
    }
    setViewMonth(newMonth);
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;

    if (formatted > effectiveMaxDate) {
      return;
    }
    if (effectiveMinDate && formatted < effectiveMinDate) {
      return;
    }

    onChange(name, formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    if (todayStr <= effectiveMaxDate && (!effectiveMinDate || todayStr >= effectiveMinDate)) {
      onChange(name, todayStr);
      setViewYear(parseInt(todayStr.split('-')[0], 10));
      setViewMonth(parseInt(todayStr.split('-')[1], 10) - 1);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(name, '');
    setIsOpen(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const val = e.target.value;
    onChange(name, val);
  };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  return (
    <div ref={triggerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          name={name}
          id={name}
          value={value || ''}
          onChange={handleManualInput}
          readOnly={readOnly}
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={`form-input pr-10 cursor-pointer ${
            readOnly ? 'bg-slate-50 text-slate-700 font-medium' : ''
          } ${
            hasError ? 'border-rose-400 bg-rose-50/20' : ''
          }`}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-label="Calendar"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#176B87] hover:text-[#123B5D] hover:bg-[#DFF5F2]/60 rounded-lg transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {isOpen && mounted && popoverCoords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            width: `${popoverCoords.width}px`,
            zIndex: 9999,
          }}
          className="bg-white rounded-2xl shadow-2xl border border-[#D8E2E8] p-3.5 select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Controls: Navigation + Month/Year Selectors */}
          <div className="flex items-center justify-between gap-1.5 mb-3 pb-2.5 border-b border-[#D8E2E8]">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrevMonth}
              aria-label="Previous Month"
              className={`p-1 rounded-lg transition-colors ${
                canGoPrevMonth
                  ? 'text-[#176B87] hover:bg-[#E8F3F6] cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="text-xs font-semibold text-[#123B5D] bg-[#F4F8FA] border border-[#D8E2E8] rounded-lg px-2 py-1 focus:outline-none focus:border-[#176B87] cursor-pointer"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option
                    key={idx}
                    value={idx}
                    disabled={viewYear === maxYear && idx > maxMonth}
                  >
                    {mName}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={handleYearChange}
                className="text-xs font-semibold text-[#123B5D] bg-[#F4F8FA] border border-[#D8E2E8] rounded-lg px-2 py-1 focus:outline-none focus:border-[#176B87] cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canGoNextMonth}
              aria-label="Next Month"
              className={`p-1 rounded-lg transition-colors ${
                canGoNextMonth
                  ? 'text-[#176B87] hover:bg-[#E8F3F6] cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((wd, i) => (
              <div
                key={i}
                className={`text-[11px] font-bold py-1 ${
                  i === 6 ? 'text-rose-500' : 'text-[#64748B]'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8 w-8" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
              const isFuture = dateStr > effectiveMaxDate;
              const isPast = effectiveMinDate ? dateStr < effectiveMinDate : false;
              const isDisabledDay = isFuture || isPast;
              const isSelected = value === dateStr;
              const isToday = dateStr === todayStr;

              if (isDisabledDay) {
                return (
                  <button
                    key={day}
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={isFuture ? "भविष्यको मिति छनोट गर्न मिल्दैन" : "विगतको मिति छनोट गर्न मिल्दैन"}
                    className="h-8 w-8 text-xs text-slate-300 bg-slate-50/50 rounded-lg cursor-not-allowed flex items-center justify-center select-none"
                  >
                    {day}
                  </button>
                );
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#176B87] text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-[#176B87] text-[#176B87] font-bold bg-[#DFF5F2]/50 hover:bg-[#DFF5F2]'
                      : 'text-[#1E293B] hover:bg-[#E8F3F6] hover:text-[#176B87]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D8E2E8] text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="font-semibold text-[#176B87] hover:text-[#123B5D] px-2 py-1 rounded-md hover:bg-[#E8F3F6] transition-colors cursor-pointer"
            >
              आज (Today)
            </button>
            <div className="flex items-center gap-1">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="font-medium text-[#64748B] hover:text-[#DC2626] px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  खाली (Clear)
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-medium text-[#64748B] hover:text-[#1E293B] px-2 py-1 rounded-md hover:bg-[#F4F8FA] transition-colors cursor-pointer"
              >
                बन्द (Close)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

interface IncidentFormProps {
  initialData?: Partial<IncidentRecord>;
  onSubmit: (formData: Partial<IncidentRecord>) => Promise<void>;
  isStaff?: boolean;
  isEdit?: boolean;
  loading?: boolean;
  error?: string | null;
}

export default function IncidentForm({
  initialData = {},
  onSubmit,
  isStaff = false,
  isEdit = false,
  loading = false,
  error = null,
}: IncidentFormProps) {
  // Form State
  const [formData, setFormData] = useState<Partial<IncidentRecord>>({
    form_number: '',
    district: '',
    municipality: '',
    ward_number: undefined,
    location: '',
    collection_date: getTodayStr(), // Default date (today)
    full_name: '',
    age: undefined,
    gender: 'male',
    family_contact: '',
    phone: '',
    incident_type: 'injured',
    other_incident_type: '',
    incident_date: '',
    incident_location: '',
    incident_description: '',
    body_found: 'no',
    identified: 'yes',
    search_status: 'ongoing',
    family_informed: 'yes',
    injury_type: '',
    treatment_location: '',
    current_condition: 'under_treatment',
    is_child: false,
    child_guardian_lost: false,
    child_separated_from_family: false,
    child_school_affected: false,
    child_other: '',
    is_woman: false,
    is_pregnant: false,
    is_postpartum: false,
    is_single_woman: false,
    is_woman_led_family: false,
    woman_other: '',
    verification_status: initialData.verification_status || ('' as any),
    verified_by: '',
    data_collector: '',
    signature_info: '',
    collection_sign_date: getTodayStr(),
    ...initialData,
  });

  // Ensure collection_sign_date is populated with today's date if empty
  useEffect(() => {
    const today = getTodayStr();
    if (!formData.collection_sign_date) {
      setFormData((prev) => ({ ...prev, collection_sign_date: today }));
    }
  }, [formData.collection_sign_date]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ─── Nepal Cascading Geo Data ───────────────────────────────────────────────
  const ALL_DISTRICTS = getDistricts();
  const availableMunicipalities = formData.district
    ? getMunicipalities(formData.district)
    : [];
  const availableWards = formData.district && formData.municipality
    ? getWards(formData.district, formData.municipality)
    : [];
  // ────────────────────────────────────────────────────────────────────────────

  const todayStr = getTodayStr();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  /** When district changes → reset municipality + ward */
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      municipality: '',
      ward_number: undefined,
    }));
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.district;
      delete copy.municipality;
      delete copy.ward_number;
      return copy;
    });
  };

  /** When municipality changes → reset ward */
  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMun = e.target.value;
    setFormData((prev) => ({
      ...prev,
      municipality: newMun,
      ward_number: undefined,
    }));
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.municipality;
      delete copy.ward_number;
      return copy;
    });
  };

  /** When ward changes */
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      ward_number: val ? Number(val) : undefined,
    }));
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.ward_number;
      return copy;
    });
  };

  const handleDateChange = (name: string, value: string) => {
    const currentToday = getTodayStr();
    if (value && value > currentToday) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: 'भविष्यको मिति राख्न मिल्दैन (अधिकतम मिति आज हो)',
      }));
    } else {
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const copy = { ...prev };
          delete copy[name];
          return copy;
        });
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleValidation = (): boolean => {
    const errors: Record<string, string> = {};
    const currentToday = getTodayStr();

    if (!formData.district?.trim()) errors.district = 'जिल्ला चयन गर्न अनिवार्य छ';
    if (!formData.municipality?.trim()) errors.municipality = 'पालिका उल्लेख गर्न अनिवार्य छ';
    
    // Validate ward_number
    const wardStr = formData.ward_number !== undefined && formData.ward_number !== null ? String(formData.ward_number).trim() : '';
    if (!wardStr || isNaN(Number(wardStr))) {
      errors.ward_number = 'वडा नं. उल्लेख गर्न अनिवार्य छ';
    } else {
      const numWard = Number(wardStr);
      if (numWard < 1 || numWard > 100) {
        errors.ward_number = 'वडा नं. १ देखि १०० बीच हुनुपर्छ';
      }
    }

    // Validate collection_date
    if (!formData.collection_date?.trim()) {
      errors.collection_date = 'संकलन मिति आवश्यक छ';
    } else if (formData.collection_date > currentToday) {
      errors.collection_date = 'भविष्यको मिति राख्न मिल्दैन (अधिकतम मिति आज हो)';
    }

    // Validate incident_date if provided
    if (formData.incident_date && formData.incident_date > currentToday) {
      errors.incident_date = 'भविष्यको मिति राख्न मिल्दैन (अधिकतम मिति आज हो)';
    }

    if (!formData.full_name?.trim()) errors.full_name = 'प्रभावित व्यक्तिको नाम, थर आवश्यक छ';

    // Validate age
    const ageStr = formData.age !== undefined && formData.age !== null ? String(formData.age).trim() : '';
    if (!ageStr || isNaN(Number(ageStr))) {
      errors.age = 'उमेर उल्लेख गर्न अनिवार्य छ';
    } else {
      const numAge = Number(ageStr);
      if (numAge < 0 || numAge > 130) {
        errors.age = 'उमेर ० देखि १३० बीच हुनुपर्छ';
      }
    }

    // Validate collection_sign_date (must be present and must be today's date)
    const signDateStr = formData.collection_sign_date ? String(formData.collection_sign_date).trim() : '';
    if (!signDateStr) {
      errors.collection_sign_date = 'मिति (हस्ताक्षर/प्रमाणीकरण मिति) आवश्यक छ (Date is required)';
    } else if (signDateStr !== currentToday) {
      errors.collection_sign_date = 'फारम बुझाएको आजको मिति मात्र मान्य हुन्छ (Only today\'s date is allowed)';
    }

    if (!formData.gender) errors.gender = 'लिङ्ग छनोट गर्नुहोस्';
    if (!formData.incident_type) errors.incident_type = 'घटनाको प्रकार छनोट गर्नुहोस्';
    if (formData.incident_type === 'other' && !formData.other_incident_type?.trim()) {
      errors.other_incident_type = 'अन्य घटनाको प्रकृति खुलाउनुहोस्';
    }

    // Validate verification_status
    if (!formData.verification_status || !['verified', 'pending'].includes(formData.verification_status)) {
      errors.verification_status = 'सत्यापन अवस्था छनोट गर्न अनिवार्य छ (Verification status is required)';
    }

    // Validate verified_by
    if (!formData.verified_by || !formData.verified_by.trim()) {
      errors.verified_by = 'सत्यापन गर्ने व्यक्ति / संस्था उल्लेख गर्न अनिवार्य छ (Verified by is required)';
    }

    // Validate data_collector
    if (!formData.data_collector || !formData.data_collector.trim()) {
      errors.data_collector = 'तथ्याङ्क संकलक उल्लेख गर्न अनिवार्य छ (Data collector is required)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Prevent Enter key in input fields from submitting the form prematurely
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Allow Enter inside multiline textareas
      if (target.tagName === 'TEXTAREA') {
        return;
      }
      // Allow Enter on buttons (e.g. activating a button via keyboard)
      if (target.tagName === 'BUTTON') {
        return;
      }
      // Allow Enter in select dropdowns (for selecting options)
      if (target.tagName === 'SELECT') {
        return;
      }
      // Prevent accidental submission when Enter is pressed in text, number, date, or other input fields
      e.preventDefault();
    }
  };

  // Close confirmation modal on Escape key
  useEffect(() => {
    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false);
      }
    };
    if (showConfirmModal) {
      document.addEventListener('keydown', handleModalKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [showConfirmModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentToday = getTodayStr();
    if (!formData.collection_sign_date || formData.collection_sign_date !== currentToday) {
      setFormData((prev) => ({ ...prev, collection_sign_date: currentToday }));
    }
    if (!handleValidation()) {
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }
    // Validation passed, do not submit immediately! Prompt user for confirmation.
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const currentToday = getTodayStr();
    const payload = {
      ...formData,
      collection_sign_date: currentToday,
    };
    await onSubmit(payload);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const showDeathMissingSection =
    formData.incident_type === 'death' || formData.incident_type === 'missing';
  const showInjurySection = formData.incident_type === 'injured';

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="space-y-6 text-sm"
    >
      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">फारम बुझाउन सकिएन:</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: आधारभूत विवरण */}
      <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
        

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* फारम नं. */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              फारम नं. (Form No.)
            </label>
            <input
              type="text"
              name="form_number"
              value={formData.form_number || ''}
              onChange={handleChange}
              placeholder=""
              className="form-input"
            />
          </div>

          {/* जिल्ला */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              जिल्ला (District) <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-district"
              name="district"
              value={formData.district || ''}
              onChange={handleDistrictChange}
              className={`form-select ${formErrors.district ? 'border-rose-400 bg-rose-50/20' : ''}`}
            >
              <option value="">-- जिल्ला छान्नुहोस् --</option>
              {ALL_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {formErrors.district && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.district}</p>
            )}
          </div>

          {/* पालिका */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              पालिका (Municipality/Rural Municipality) <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-municipality"
              name="municipality"
              value={formData.municipality || ''}
              onChange={handleMunicipalityChange}
              disabled={!formData.district}
              className={`form-select ${
                formErrors.municipality ? 'border-rose-400 bg-rose-50/20' : ''
              } ${!formData.district ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {formData.district ? '-- पालिका छान्नुहोस् --' : '-- पहिले जिल्ला छान्नुहोस् --'}
              </option>
              {availableMunicipalities.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.wards} वडा)
                </option>
              ))}
            </select>
            {formErrors.municipality && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.municipality}</p>
            )}
          </div>

          {/* वडा नं. */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              वडा नं. (Ward No.) <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-ward-number"
              name="ward_number"
              value={formData.ward_number ?? ''}
              onChange={handleWardChange}
              disabled={!formData.municipality || availableWards.length === 0}
              className={`form-select ${
                formErrors.ward_number ? 'border-rose-400 bg-rose-50/20' : ''
              } ${!formData.municipality ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {formData.municipality ? '-- वडा छान्नुहोस् --' : '-- पहिले पालिका छान्नुहोस् --'}
              </option>
              {availableWards.map((w) => (
                <option key={w} value={w}>
                  वडा नं. {w}
                </option>
              ))}
            </select>
            {formErrors.ward_number && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.ward_number}</p>
            )}
          </div>

          {/* स्थान / बस्ती */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              स्थान / बस्ती / टोल (Settlement/Location)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              placeholder=""
              className="form-input"
            />
          </div>

          {/* तथ्याङ्क संकलन मिति */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              तथ्याङ्क संकलन मिति (Collection Date) <span className="text-rose-500">*</span>
            </label>

            <DatePicker
              name="collection_date"
              value={formData.collection_date || ''}
              onChange={handleDateChange}
              hasError={!!formErrors.collection_date}
              placeholder="YYYY-MM-DD"
              maxDate={todayStr}
            />

            {formErrors.collection_date && (
              <p className="text-xs text-rose-500 mt-1">
                {formErrors.collection_date}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1.1: व्यक्तिगत विवरण */}
      <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#DFF5F2]/40 border-b border-[#D8E2E8] flex items-center gap-2.5">
          <User className="w-5 h-5 text-[#0F766E]" />
          <div>
            <h2 className="text-base font-bold text-[#123B5D]">
              १ व्यक्तिगत विवरण (Person Details)
            </h2>
           
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* नाम, थर */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              नाम, थर (Full Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name || ''}
              onChange={handleChange}
              placeholder=""
              className={`form-input ${formErrors.full_name ? 'border-rose-400 bg-rose-50/20' : ''}`}
            />
            {formErrors.full_name && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.full_name}</p>
            )}
          </div>

          {/* उमेर */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              उमेर (Age) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              min="0"
              max="130"
              value={formData.age ?? ''}
              onChange={handleChange}
              placeholder=""
              className={`form-input ${formErrors.age ? 'border-rose-400 bg-rose-50/20' : ''}`}
            />
            {formErrors.age && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.age}</p>
            )}
          </div>

          {/* लिङ्ग */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              लिङ्ग (Gender) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-4 pt-2">
              {GENDER_OPTIONS.map((g) => (
                <label key={g.value} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="gender"
                    value={g.value}
                    checked={formData.gender === g.value}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#176B87] accent-[#176B87] focus:ring-[#176B87]"
                  />
                  <span>{g.label.split(' ')[0]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* परिवारको नाम / सम्पर्क व्यक्ति */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              परिवारको नाम / सम्पर्क व्यक्ति (Family Contact Person)
            </label>
            <input
              type="text"
              name="family_contact"
              value={formData.family_contact || ''}
              onChange={handleChange}
              placeholder=""
              className="form-input"
            />
          </div>

         
         
        </div>
      </div>

      {/* SECTION 2: घटनाको विवरण */}
      <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#DFF5F2]/40 border-b border-[#D8E2E8] flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#0F766E]" />
          <div>
            <h2 className="text-base font-bold text-[#123B5D]">
              २. घटनाको विवरण (Incident Details)
            </h2>
            
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* घटनाको प्रकार */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                घटनाको प्रकार (Incident Type) <span className="text-rose-500">*</span>
              </label>
              <select
                name="incident_type"
                value={formData.incident_type}
                onChange={handleChange}
                className="form-select font-semibold"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* यदि अन्य भए उल्लेख गर्नुहोस् */}
            {formData.incident_type === 'other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  अन्य घटना उल्लेख गर्नुहोस् <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="other_incident_type"
                  value={formData.other_incident_type || ''}
                  onChange={handleChange}
                  placeholder=""
                  className="form-input"
                />
              </div>
            )}

            {/* घटना भएको मिति */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                घटना भएको मिति (Incident Date)
              </label>
              <DatePicker
                name="incident_date"
                value={formData.incident_date || ''}
                onChange={handleDateChange}
                hasError={!!formErrors.incident_date}
                placeholder="YYYY-MM-DD"
                maxDate={todayStr}
              />
              {formErrors.incident_date && (
                <p className="text-xs text-rose-500 mt-1">
                  {formErrors.incident_date}
                </p>
              )}
            </div>

            {/* घटना भएको स्थान */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                घटना भएको स्थान (Incident Location)
              </label>
              <input
                type="text"
                name="incident_location"
                value={formData.incident_location || ''}
                onChange={handleChange}
                placeholder=""
                className="form-input"
              />
            </div>
          </div>

          {/* घटनाको संक्षिप्त विवरण */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              घटनाको संक्षिप्त विवरण (Incident Details)
            </label>
            <textarea
              name="incident_description"
              rows={3}
              value={formData.incident_description || ''}
              onChange={handleChange}
              placeholder=""
              className="form-textarea"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: मृत्यु / बेपत्ता भएमा (Conditionally Visible) */}
      {showDeathMissingSection && (
        <div className="bg-rose-50/40 rounded-2xl border border-rose-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="px-5 py-3.5 bg-rose-100/70 border-b border-rose-200 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-700" />
            <div>
              <h2 className="text-base font-bold text-rose-950">
                ३. मृत्यु / बेपत्ता भएमा (Death / Missing )
              </h2>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* शव फेला परेको */}
             

            <div>
  <label className="block text-xs font-semibold text-slate-700 mb-2">
    शव फेला परेको (Body Found):
  </label>

  <div className="flex gap-3">
    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="body_found"
        value="yes"
        checked={formData.body_found === 'yes'}
        onChange={handleChange}
      />
      <span>हो (Yes)</span>
    </label>

    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="body_found"
        value="no"
        checked={formData.body_found === 'no'}
        onChange={handleChange}
      />
      <span>होइन (No)</span>
    </label>
  </div>
</div>
{/* 
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                शव फेला परेको? (Body Found)
              </label>
              <select
                name="body_found"
                value={formData.body_found || 'no'}
                onChange={handleChange}
                className="form-select bg-white"
              >
                <option value="yes">हो (Yes)</option>
                <option value="no">होइन (No)</option>
              </select>
            </div> */}

            {/* पहिचान भएको */}

            <div>
  <label className="block text-xs font-semibold text-slate-700 mb-2">
    पहिचान भएको (Identified) :
  </label>

  <div className="flex gap-3">
    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="identified"
        value="yes"
        checked={formData.identified === 'yes'}
        onChange={handleChange}
      />
      <span>भएको (Yes)</span>
    </label>

    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="identified"
        value="no"
        checked={formData.identified === 'no'}
        onChange={handleChange}
      />
      <span>होइन (Unidentified)</span>
    </label>
  </div>
</div>
            {/* <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                पहिचान / सनाखत भएको? (Identified)
              </label>
              <select
                name="identified"
                value={formData.identified || 'yes'}
                onChange={handleChange}
                className="form-select bg-white"
              >
                <option value="yes">भएको (Yes)</option>
                <option value="no">हुन बाँकी (Unidentified)</option>
              </select>
            </div> */}

            {/* बेपत्ता भए खोजीको अवस्था */}
            <div>
  <label className="block text-xs font-semibold text-slate-700 mb-2">
   बेपत्ता भए खोजीको अवस्था (Search Status) :
  </label>

  <div className="flex flex-wrap gap-3">
    {SEARCH_STATUS_OPTIONS.map((s) => (
      <label
        key={s.value}
        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400"
      >
        <input
          type="radio"
          name="search_status"
          value={s.value}
          checked={formData.search_status === s.value}
          onChange={handleChange}
        />

        <span>{s.label}</span>
      </label>
    ))}
  </div>
</div>
            {/* <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                खोजीको अवस्था (Search Status)
              </label>
              <select
                name="search_status"
                value={formData.search_status || 'ongoing'}
                onChange={handleChange}
                className="form-select bg-white"
              >
                {SEARCH_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div> */}

            {/* परिवारलाई जानकारी */}
            <div>
  <label className="block text-xs font-semibold text-slate-700 mb-2">
    परिवारलाई जानकारी / सूचना (Family Informed) :
  </label>

  <div className="flex gap-3">
    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="family_informed"
        value="yes"
        checked={formData.family_informed === 'yes'}
        onChange={handleChange}
      />
      <span>भएको (Yes)</span>
    </label>

    <label className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:text-teal-400">
      <input
        type="radio"
        name="family_informed"
        value="no"
        checked={formData.family_informed === 'no'}
        onChange={handleChange}
      />
      <span>नभएको (No)</span>
    </label>
  </div>
</div>
            {/* <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                परिवारलाई जानकारी / सूचना (Family Informed)
              </label>
              <select
                name="family_informed"
                value={formData.family_informed || 'yes'}
                onChange={handleChange}
                className="form-select bg-white"
              >
                <option value="yes">भएको (Yes)</option>
                <option value="no">नभएको (No)</option>
              </select>
            </div> */}
          </div>
        </div>
      )}

      {/* SECTION 4: घाइते / अपाङ्गता भएमा (Conditionally Visible) */}
      {showInjurySection && (
        <div className="bg-orange-50/40 rounded-2xl border border-orange-200 overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="px-5 py-3.5 bg-orange-100/70 border-b border-orange-200 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-orange-700" />
            <div>
              <h2 className="text-base font-bold text-orange-950">
                ४. घाइते / अपाङ्गता भएमा (Injury / Treatment Details)
              </h2>
              <p className="text-xs text-orange-700">
                चोटको प्रकृति, उपचार गरिएको अस्पताल र हालको अवस्था
              </p>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* चोट / अपाङ्गताको प्रकृति */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                चोट / अपाङ्गताको प्रकृति (Nature of Injury)
              </label>
              <input
                type="text"
                name="injury_type"
                value={formData.injury_type || ''}
                onChange={handleChange}
                placeholder=""
                className="form-input bg-white"
              />
            </div>

            {/* उपचार गरिएको स्थान */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                उपचार गरिएको स्थान / अस्पताल (Hospital / Facility)
              </label>
              <input
                type="text"
                name="treatment_location"
                value={formData.treatment_location || ''}
                onChange={handleChange}
                placeholder=""
                className="form-input bg-white"
              />
            </div>

            {/* हालको अवस्था */}
            {/* हालको अवस्था */}
  <div className="w-full md:col-span-2">
    <label className="block text-xs font-semibold text-slate-700 mb-2">
      हालको स्वास्थ्य अवस्था (Current Condition)
    </label>

    <div className="flex flex-wrap gap-3">

      {CONDITION_OPTIONS.map((c) => (
        <label
          key={c.value}
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${
            formData.current_condition === c.value
              ? 'border-teal-500 bg-teal-50'
              : 'border-slate-300 bg-white hover:border-teal-400'
          }`}
        >
          <input
            type="radio"
            name="current_condition"
            value={c.value}
            checked={formData.current_condition === c.value}
            onChange={handleChange}
            className="accent-teal-600"
          />

          <span className="text-sm text-slate-700">
            {c.label}
          </span>
        </label>
      ))}

    </div>
  </div>

          </div>
        </div>
      )}

      {/* SECTION 5: बालबालिका तथा महिला सम्बन्धी विवरण */}
      <div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#DFF5F2]/40 border-b border-[#D8E2E8] flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#0F766E]" />
          <div>
            <h2 className="text-base font-bold text-[#123B5D]">
              ५. बालबालिका तथा महिला सम्बन्धी विशेष विवरण
            </h2>
            
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* बालबालिका (Children) */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-slate-100">
              <input
                type="checkbox"
                name="is_child"
                checked={Boolean(formData.is_child)}
                onChange={handleChange}
                className="w-4 h-4 text-[#176B87] accent-[#176B87] rounded focus:ring-[#176B87]"
              />
              <span className="font-bold text-[#1E293B]">
                प्रभावित व्यक्ति बालबालिका हुन्
              </span>
            </label>

            {Boolean(formData.is_child) && (
              <div className="pl-6 space-y-2.5 pt-1 animate-in fade-in duration-150">
                <p className="text-xs text-[#64748B] font-semibold mb-1">
                  यदि हो भने लागू हुने विकल्पहरू छान्नुहोस्:
                </p>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="child_guardian_lost"
                    checked={Boolean(formData.child_guardian_lost)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>अभिभावक गुमाएको (Lost Guardian)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="child_separated_from_family"
                    checked={Boolean(formData.child_separated_from_family)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>परिवारबाट छुट्टिएको (Separated from Family)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="child_school_affected"
                    checked={Boolean(formData.child_school_affected)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>विद्यालय प्रभावित भएको (Schooling Affected)</span>
                </label>
                <div className="pt-1">
                  <input
                    type="text"
                    name="child_other"
                    value={formData.child_other || ''}
                    onChange={handleChange}
                    placeholder="अन्य बालबालिका सम्बन्धी कैफियत..."
                    className="form-input text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* महिला (Women) */}
          <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
            <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-slate-100">
              <input
                type="checkbox"
                name="is_woman"
                checked={Boolean(formData.is_woman)}
                onChange={handleChange}
                className="w-4 h-4 text-[#176B87] accent-[#176B87] rounded focus:ring-[#176B87]"
              />
              <span className="font-bold text-[#1E293B]">
                प्रभावित व्यक्ति महिला हुन्
              </span>
            </label>

            {Boolean(formData.is_woman) && (
              <div className="pl-6 space-y-2.5 pt-1 animate-in fade-in duration-150">
                <p className="text-xs text-[#64748B] font-semibold mb-1">
                  यदि हो भने लागू हुने विकल्पहरू छान्नुहोस्:
                </p>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_pregnant"
                    checked={Boolean(formData.is_pregnant)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>गर्भवती (Pregnant)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_postpartum"
                    checked={Boolean(formData.is_postpartum)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>सुत्केरी (Postpartum / Lactating)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_single_woman"
                    checked={Boolean(formData.is_single_woman)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>एकल महिला (Single Woman)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1E293B] cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_woman_led_family"
                    checked={Boolean(formData.is_woman_led_family)}
                    onChange={handleChange}
                    className="w-3.5 h-3.5 text-[#176B87] accent-[#176B87] rounded"
                  />
                  <span>महिला नेतृत्वको परिवार (Woman-Led Household)</span>
                </label>
                <div className="pt-1">
                  <input
                    type="text"
                    name="woman_other"
                    value={formData.woman_other || ''}
                    onChange={handleChange}
                    placeholder="अन्य महिला सम्बन्धी विशेष कैफियत..."
                    className="form-input text-xs"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
{/* SECTION 6: प्रमाणीकरण र संकलक विवरण */}
<div className="bg-white rounded-2xl border border-[#D8E2E8] overflow-hidden shadow-xs">

  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

    {/* सत्यापन अवस्था */}
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-2">
        सत्यापन (Verification Status) <span className="text-rose-500">*</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <label
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${
            formData.verification_status === 'verified'
              ? 'border-[#0F766E] bg-[#DFF5F2]'
              : formErrors.verification_status
              ? 'border-rose-400 bg-rose-50/20 hover:border-rose-500'
              : 'border-[#D8E2E8] bg-white hover:border-[#0F766E]'
          }`}
        >
          <input
            type="radio"
            name="verification_status"
            value="verified"
            checked={formData.verification_status === 'verified'}
            onChange={handleChange}
            className="accent-[#0F766E]"
          />
          <span className="text-sm text-[#1E293B]">
            भएको (Verified)
          </span>
        </label>
        <label
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition ${
            formData.verification_status === 'pending'
              ? 'border-[#0F766E] bg-[#DFF5F2]'
              : formErrors.verification_status
              ? 'border-rose-400 bg-rose-50/20 hover:border-rose-500'
              : 'border-[#D8E2E8] bg-white hover:border-[#0F766E]'
          }`}
        >
          <input
            type="radio"
            name="verification_status"
            value="pending"
            checked={formData.verification_status === 'pending'}
            onChange={handleChange}
            className="accent-[#0F766E]"
          />
          <span className="text-sm text-[#1E293B]">
            हुन बाँकी (Pending)
          </span>
        </label>
      </div>
      {formErrors.verification_status && (
        <p className="text-xs text-rose-500 mt-1">{formErrors.verification_status}</p>
      )}
    </div>

    {/* सत्यापन गर्ने व्यक्ति / संस्था */}
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        सत्यापन गर्ने व्यक्ति / संस्था (Verified By) <span className="text-rose-500">*</span>
      </label>

      <input
        type="text"
        name="verified_by"
        value={formData.verified_by || ''}
        onChange={handleChange}
        placeholder=""
        className={`form-input ${formErrors.verified_by ? 'border-rose-400 bg-rose-50/20' : ''}`}
      />
      {formErrors.verified_by && (
        <p className="text-xs text-rose-500 mt-1">{formErrors.verified_by}</p>
      )}
    </div>

    {/* तथ्याङ्क संकलक */}
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        तथ्याङ्क संकलक (Data Collector) <span className="text-rose-500">*</span>
      </label>

      <input
        type="text"
        name="data_collector"
        value={formData.data_collector || ''}
        onChange={handleChange}
        placeholder=""
        className={`form-input ${formErrors.data_collector ? 'border-rose-400 bg-rose-50/20' : ''}`}
      />
      {formErrors.data_collector && (
        <p className="text-xs text-rose-500 mt-1">{formErrors.data_collector}</p>
      )}
    </div>


    {/* हस्ताक्षर वा डिजिटल विवरण */}
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        हस्ताक्षर (Signature)
      </label>

      <input
        type="text"
        name="signature_info"
        value={formData.signature_info || ''}
        onChange={handleChange}
        placeholder=""
        className="form-input"
      />
    </div>

    {/* मिति (Date) */}
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        मिति (Date) <span className="text-rose-500">*</span>
      </label>

      <DatePicker
        name="collection_sign_date"
        value={formData.collection_sign_date || todayStr}
        onChange={handleDateChange}
        hasError={!!formErrors.collection_sign_date}
        placeholder="YYYY-MM-DD"
        minDate={todayStr}
        maxDate={todayStr}
        readOnly={true}
      />

      {formErrors.collection_sign_date && (
        <p className="text-xs text-rose-500 mt-1">
          {formErrors.collection_sign_date}
        </p>
      )}
      <p className="text-[11px] text-[#64748B] mt-1">
        * फारम बुझाएको आजको मिति स्वतः कायम हुन्छ
      </p>
    </div>

  </div>
</div>
      {/* Form Submission Action */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#176B87] hover:bg-[#123B5D] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>पेश गरिँदैछ...</span>
            </>
          ) : isEdit ? (
            <>
              <Save className="w-5 h-5" />
              <span>रेकर्ड अद्यावधिक गर्नुहोस् (Save Changes)</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>{isStaff ? 'रेकर्ड सुरक्षित गर्नुहोस्' : 'तथ्याङ्क पेश गर्नुहोस् (Submit Incident)'}</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Warning Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D8E2E8] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#DFF5F2]/60 border-b border-[#D8E2E8] p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#176B87] flex items-center justify-center text-white shrink-0 shadow-xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 id="confirm-modal-title" className="text-base font-bold text-[#123B5D]">
                  फारम पेश गर्ने पुष्टि (Confirm Submission)
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  कृपया विवरण जाँच गरी पेश गर्नुहोस्
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={loading}
                aria-label="Close"
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Warning Message */}
            <div className="p-5 space-y-4 text-sm">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-semibold text-amber-950">
                    Are you sure you want to submit this form? Please review your information before submitting.
                  </p>
                  <p className="text-amber-800/90">
                    (के तपाईं यो फारम पेश गर्न निश्चित हुनुहुन्छ? कृपया पेश गर्नुअघि आफ्नो विवरण समीक्षा गर्नुहोस्।)
                  </p>
                </div>
              </div>

              {/* Summary of Key Information */}
              <div className="bg-[#F4F8FA] p-3.5 rounded-xl border border-[#D8E2E8] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">प्रभावितको नाम:</span>
                  <span className="font-bold text-[#1E293B]">{formData.full_name || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">जिल्ला / पालिका:</span>
                  <span className="font-medium text-[#1E293B]">
                    {formData.district || '-'}, {formData.municipality || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">संकलन मिति:</span>
                  <span className="font-semibold text-[#176B87]">{formData.collection_date || '-'}</span>
                </div>
                {formData.incident_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">घटना भएको मिति:</span>
                    <span className="font-medium text-[#1E293B]">{formData.incident_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 bg-[#F4F8FA] border-t border-[#D8E2E8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={loading}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#E8F3F6] bg-white border border-[#D8E2E8] rounded-xl transition-colors cursor-pointer"
              >
                रद्द गर्नुहोस् (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#123B5D] rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>पेश गरिँदैछ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>पुष्टि गर्नुहोस् (OK / Confirm)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
