'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  User as UserIcon,
  MapPin,
  AlertCircle,
  Activity,
  Baby,
  Users,
  CheckCircle,
  Edit,
} from 'lucide-react';
import { IncidentRecord, UserRole } from '@/types';
import {
  getIncidentLabel,
  getGenderLabel,
  getVerificationBadge,
  SEARCH_STATUS_OPTIONS,
  CONDITION_OPTIONS,
} from '@/services/nepalData';

interface RecordDetailModalProps {
  record: IncidentRecord | null;
  userRole?: UserRole | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#64748B] font-medium mb-0.5">{label}</p>
      <p className="font-semibold text-[#1E293B] text-sm">{value || '-'}</p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  colorClass = 'text-[#176B87]',
}: {
  icon: React.ReactNode;
  title: string;
  colorClass?: string;
}) {
  return (
    <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${colorClass}`}>
      {icon}
      <span>{title}</span>
    </h3>
  );
}

export default function RecordDetailModal({ record, userRole, onClose }: RecordDetailModalProps) {
  if (!record) return null;

  const verificationBadge = getVerificationBadge(record.verification_status);

  const showDeathMissingSection =
    record.incident_type === 'death' || record.incident_type === 'missing';
  const showInjurySection = record.incident_type === 'injured';

  const getSearchStatusLabel = (val?: string | null) => {
    if (!val) return '-';
    const found = SEARCH_STATUS_OPTIONS.find((s) => s.value === val);
    return found ? found.label : val;
  };

  const getConditionLabel = (val?: string | null) => {
    if (!val) return '-';
    const found = CONDITION_OPTIONS.find((c) => c.value === val);
    return found ? found.label : val;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#D8E2E8] overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">

        {/* Header Bar */}
        <div className="px-6 py-4.5 bg-[#123B5D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-white/15 backdrop-blur-xs rounded-lg border border-white/20 font-mono text-sm font-bold tracking-wider">
              {record.record_code}
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {record.full_name}
              </h2>
              <p className="text-xs text-[#DFF5F2]">
                {record.district}, {record.municipality}
                {record.ward_number ? ` - वडा नं. ${record.ward_number}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${verificationBadge.class}`}>
              {verificationBadge.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="बन्द गर्नुहोस्"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">

          {/* ── SECTION 0: आधारभूत विवरण (Form/Collection info) ── */}
          <div className="bg-[#F4F8FA] rounded-xl border border-[#D8E2E8] p-4">
            <SectionHeader
              icon={<MapPin className="w-4 h-4" />}
              title="आधारभूत विवरण (Basic Details)"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="फारम नं. (Form No.)" value={record.form_number} />
              <Field label="जिल्ला (District)" value={record.district} />
              <Field
                label="पालिका (Municipality)"
                value={record.municipality}
              />
              <Field
                label="वडा नं. (Ward No.)"
                value={record.ward_number != null ? String(record.ward_number) : '-'}
              />
              <Field
                label="स्थान / बस्ती / टोल (Settlement)"
                value={record.location}
              />
              <Field
                label="तथ्याङ्क संकलन मिति (Collection Date)"
                value={record.collection_date}
              />
            </div>
          </div>

          {/* ── SECTION 1: व्यक्तिगत विवरण ── */}
          <div className="bg-[#F4F8FA] rounded-xl border border-[#D8E2E8] p-4">
            <SectionHeader
              icon={<UserIcon className="w-4 h-4" />}
              title="१. व्यक्तिगत विवरण (Person Details)"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="नाम, थर (Full Name)" value={record.full_name} />
              <Field
                label="उमेर (Age)"
                value={record.age != null ? `${record.age} वर्ष` : '-'}
              />
              <Field label="लिङ्ग (Gender)" value={getGenderLabel(record.gender)} />
              <Field
                label="परिवारको नाम / सम्पर्क व्यक्ति (Family Contact)"
                value={record.family_contact}
              />
            </div>
          </div>

          {/* ── SECTION 2: घटनाको विवरण ── */}
          <div className="bg-[#F4F8FA] rounded-xl border border-[#D8E2E8] p-4">
            <SectionHeader
              icon={<AlertCircle className="w-4 h-4" />}
              title="२. घटनाको विवरण (Incident Details)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-[#64748B] font-medium mb-0.5">
                  घटनाको प्रकार (Incident Type)
                </p>
                <p className="font-bold text-[#DC2626] text-base">
                  {getIncidentLabel(record.incident_type)}
                </p>
                {record.other_incident_type && (
                  <p className="text-xs text-[#64748B] mt-0.5">
                    ({record.other_incident_type})
                  </p>
                )}
              </div>
              <Field label="घटना भएको मिति (Incident Date)" value={record.incident_date} />
              <Field label="घटना भएको स्थान (Incident Location)" value={record.incident_location} />
            </div>
            {record.incident_description && (
              <div className="bg-white p-3.5 rounded-lg border border-[#D8E2E8]">
                <p className="text-xs text-[#64748B] font-medium mb-1">
                  घटनाको संक्षिप्त विवरण (Incident Description):
                </p>
                <p className="text-[#1E293B] whitespace-pre-wrap leading-relaxed">
                  {record.incident_description}
                </p>
              </div>
            )}
          </div>

          {/* ── SECTION 3: मृत्यु / बेपत्ता (Conditional) ── */}
          {showDeathMissingSection && (
            <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-4">
              <SectionHeader
                icon={<AlertCircle className="w-4 h-4 text-rose-600" />}
                title="३. मृत्यु / बेपत्ता भएमा (Death / Missing)"
                colorClass="text-rose-700"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field
                  label="शव फेला परेको (Body Found)"
                  value={
                    record.body_found === 'yes'
                      ? 'हो (Yes)'
                      : record.body_found === 'no'
                      ? 'होइन (No)'
                      : '-'
                  }
                />
                <Field
                  label="पहिचान भएको (Identified)"
                  value={
                    record.identified === 'yes'
                      ? 'भएको (Yes)'
                      : record.identified === 'no'
                      ? 'हुन बाँकी (Unidentified)'
                      : '-'
                  }
                />
                <Field
                  label="बेपत्ता भए खोजीको अवस्था (Search Status)"
                  value={getSearchStatusLabel(record.search_status)}
                />
                <Field
                  label="परिवारलाई जानकारी (Family Informed)"
                  value={
                    record.family_informed === 'yes'
                      ? 'भएको (Yes)'
                      : record.family_informed === 'no'
                      ? 'नभएको (No)'
                      : '-'
                  }
                />
              </div>
            </div>
          )}

          {/* ── SECTION 4: घाइते / अपाङ्गता (Conditional) ── */}
          {showInjurySection && (
            <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-4">
              <SectionHeader
                icon={<Activity className="w-4 h-4 text-amber-600" />}
                title="४. घाइते / अपाङ्गता भएमा (Injury / Treatment Details)"
                colorClass="text-amber-700"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label="चोट / अपाङ्गताको प्रकृति (Nature of Injury)"
                  value={record.injury_type}
                />
                <Field
                  label="उपचार गरिएको स्थान / अस्पताल (Hospital / Facility)"
                  value={record.treatment_location}
                />
                <Field
                  label="हालको स्वास्थ्य अवस्था (Current Condition)"
                  value={getConditionLabel(record.current_condition)}
                />
              </div>
            </div>
          )}

          {/* ── SECTION 5: बालबालिका तथा महिला ── */}
          <div className="bg-[#F4F8FA] rounded-xl border border-[#D8E2E8] p-4">
            <SectionHeader
              icon={<Users className="w-4 h-4 text-[#0F766E]" />}
              title="५. बालबालिका तथा महिला सम्बन्धी विशेष विवरण"
              colorClass="text-[#0F766E]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Children */}
              <div className="bg-[#E8F3F6]/50 p-3.5 rounded-lg border border-[#D8E2E8]">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="w-4 h-4 text-[#176B87]" />
                  <span className="font-bold text-[#1E293B] text-sm">
                    प्रभावित व्यक्ति बालबालिका हुन्:{' '}
                    {record.is_child ? 'हो (Child)' : 'होइन'}
                  </span>
                </div>
                {record.is_child ? (
                  <ul className="text-xs space-y-1 text-[#1E293B] pl-4 list-disc">
                    {record.child_guardian_lost ? <li>अभिभावक गुमाएको (Lost Guardian)</li> : null}
                    {record.child_separated_from_family ? (
                      <li>परिवारबाट छुट्टिएको (Separated from Family)</li>
                    ) : null}
                    {record.child_school_affected ? (
                      <li>विद्यालय प्रभावित भएको (Schooling Affected)</li>
                    ) : null}
                    {record.child_other ? <li>अन्य: {record.child_other}</li> : null}
                    {!record.child_guardian_lost &&
                      !record.child_separated_from_family &&
                      !record.child_school_affected &&
                      !record.child_other && (
                        <li className="list-none text-[#64748B] pl-0">कुनै विशेष विवरण छैन।</li>
                      )}
                  </ul>
                ) : (
                  <p className="text-xs text-[#64748B]">कुनै विशेष बालबालिका विवरण छैन।</p>
                )}
              </div>

              {/* Women */}
              <div className="bg-[#DFF5F2]/40 p-3.5 rounded-lg border border-[#D8E2E8]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span className="font-bold text-[#1E293B] text-sm">
                    प्रभावित व्यक्ति महिला हुन्:{' '}
                    {record.is_woman ? 'हो (Woman)' : 'होइन'}
                  </span>
                </div>
                {record.is_woman ? (
                  <ul className="text-xs space-y-1 text-[#1E293B] pl-4 list-disc">
                    {record.is_pregnant ? <li>गर्भवती (Pregnant)</li> : null}
                    {record.is_postpartum ? <li>सुत्केरी (Postpartum / Lactating)</li> : null}
                    {record.is_single_woman ? <li>एकल महिला (Single Woman)</li> : null}
                    {record.is_woman_led_family ? (
                      <li>महिला नेतृत्वको परिवार (Woman-Led Household)</li>
                    ) : null}
                    {record.woman_other ? <li>अन्य: {record.woman_other}</li> : null}
                    {!record.is_pregnant &&
                      !record.is_postpartum &&
                      !record.is_single_woman &&
                      !record.is_woman_led_family &&
                      !record.woman_other && (
                        <li className="list-none text-[#64748B] pl-0">कुनै विशेष विवरण छैन।</li>
                      )}
                  </ul>
                ) : (
                  <p className="text-xs text-[#64748B]">कुनै विशेष महिला विवरण छैन।</p>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 6: प्रमाणीकरण र संकलक विवरण ── */}
          <div className="bg-[#F4F8FA] rounded-xl border border-[#D8E2E8] p-4">
            <SectionHeader
              icon={<CheckCircle className="w-4 h-4 text-[#0F766E]" />}
              title="६. प्रमाणीकरण र संकलक विवरण (Verification & Collector)"
              colorClass="text-[#123B5D]"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#64748B] font-medium mb-0.5">
                  सत्यापन (Verification Status)
                </p>
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${verificationBadge.class}`}
                >
                  {verificationBadge.label}
                </span>
              </div>
              <Field
                label="सत्यापन गर्ने व्यक्ति / संस्था (Verified By)"
                value={record.verified_by}
              />
              <Field
                label="तथ्याङ्क संकलक (Data Collector)"
                value={record.data_collector}
              />
              <Field
                label="हस्ताक्षर (Signature)"
                value={record.signature_info}
              />
              <Field
                label="मिति (Date)"
                value={record.collection_sign_date || record.collection_date}
              />
            </div>
          </div>

          {/* System info */}
          <div className="text-xs text-[#94A3B8] flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span>दर्ता मिति: {record.created_at ? new Date(record.created_at).toLocaleString('ne-NP') : '-'}</span>
            {record.creator_name && <span>दर्ता गर्नुभएको: {record.creator_name}</span>}
            {record.updated_at && record.updater_name && (
              <span>
                अद्यावधिक: {new Date(record.updated_at).toLocaleString('ne-NP')} ({record.updater_name})
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F4F8FA] border-t border-[#D8E2E8] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#64748B] font-mono">{record.record_code}</div>
          <div className="flex items-center gap-3">
            {userRole !== 'viewer' && (
              <Link
                href={`/dashboard/${record.id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#176B87] hover:bg-[#123B5D] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>रेकर्ड सम्पादन (Edit)</span>
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#E8F3F6] text-[#1E293B] font-medium rounded-lg border border-[#D8E2E8] transition-colors cursor-pointer"
            >
              बन्द गर्नुहोस्
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
