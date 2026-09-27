/**
 * Nepal Administrative Data & Nepali Translations Constants
 */

export const NEPAL_DISTRICTS = [
  // बागमती प्रदेश
  'काठमाडौं', 'ललितपुर', 'भक्तपुर', 'काभ्रेपलाञ्चोक', 'सिन्धुपाल्चोक', 'धादिङ', 'नुवाकोट', 'रसुवा', 'रामेछाप', 'दोलखा', 'सिन्धुली', 'मकवानपुर', 'चितवन',
  // कोशी प्रदेश
  'झापा', 'मोरङ', 'सुनसरी', 'इलाम', 'पाँचथर', 'ताप्लेजुङ', 'धनकुटा', 'तेह्रथुम', 'संखुवासभा', 'भोजपुर', 'सोलुखुम्बु', 'ओखलढुङ्गा', 'खोटाङ', 'उदयपुर',
  // मधेश प्रदेश
  'सप्तरी', 'सिराहा', 'धनुषा', 'महोत्तरी', 'सर्लाही', 'रौतहट', 'बारा', 'पर्सा',
  // गण्डकी प्रदेश
  'कास्की', 'तनहुँ', 'स्याङ्जा', 'लमजुङ', 'गोरखा', 'मनाङ', 'मुस्ताङ', 'पर्वत', 'म्याग्दी', 'बागलुङ', 'नवलपरासी (ब.सु.पू.)',
  // लुम्बिनी प्रदेश
  'रुपन्देही', 'कपिलवस्तु', 'पाल्पा', 'गुल्मी', 'अर्घाखाँची', 'दाङ', 'बाँके', 'बर्दिया', 'प्युठान', 'रोल्पा', 'रुकुम (पूर्व)', 'नवलपरासी (ब.सु.प.)',
  // कर्णाली प्रदेश
  'सुर्खेत', 'दैलेख', 'जाजरकोट', 'सल्यान', 'रुकुम (पश्चिम)', 'जुम्ला', 'कालिकोट', 'हुम्ला', 'मुगु', 'डोल्पा',
  // सुदूरपश्चिम प्रदेश
  'कैलाली', 'कञ्चनपुर', 'डडेलधुरा', 'डोटी', 'अछाम', 'बैतडी', 'दार्चुला', 'बझाङ', 'बाजुरा'
];

export const INCIDENT_TYPES = [
  { value: 'death', label: 'मृत्यु (Death)', color: 'bg-rose-50 text-[#DC2626] border-rose-200' },
  { value: 'missing', label: 'बेपत्ता (Missing)', color: 'bg-sky-50 text-[#0284C7] border-sky-200' },
  { value: 'injured', label: 'घाइते (Injured)', color: 'bg-amber-50 text-[#D97706] border-amber-200' },
  { value: 'disabled', label: 'अपाङ्गता (Disabled)', color: 'bg-amber-50 text-[#D97706] border-amber-200' },
  { value: 'other', label: 'अन्य (Other)', color: 'bg-slate-50 text-[#64748B] border-[#D8E2E8]' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'पुरुष (Male)' },
  { value: 'female', label: 'महिला (Female)' },
  { value: 'other', label: 'अन्य (Other)' },
];

export const SEARCH_STATUS_OPTIONS = [
  { value: 'ongoing', label: 'जारी (Ongoing)' },
  { value: 'suspended', label: 'रोकिएको (Suspended)' },
  { value: 'found', label: 'फेला परेको (Found)' },
];

export const CONDITION_OPTIONS = [
  { value: 'under_treatment', label: 'उपचाररत (Under Treatment)' },
  { value: 'recovered', label: 'निको भएको (Recovered)' },
  { value: 'further_treatment_needed', label: 'थप उपचार आवश्यक (Further Treatment Needed)' },
];

export const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'प्रमाणीत (Verified)', color: 'bg-emerald-50 text-[#16803C] border-emerald-200' },
  { value: 'pending', label: 'हुन बाँकी (Pending)', color: 'bg-amber-50 text-[#D97706] border-amber-200' },
];

export function getIncidentLabel(val?: string | null): string {
  if (!val) return '-';
  const found = INCIDENT_TYPES.find(t => t.value === val);
  return found ? found.label : val;
}

export function getGenderLabel(val?: string | null): string {
  if (!val) return '-';
  const found = GENDER_OPTIONS.find(g => g.value === val);
  return found ? found.label : val;
}

export function getVerificationBadge(val?: string | null) {
  if (val === 'verified') {
    return { label: 'प्रमाणीत (Verified)', class: 'bg-emerald-50 text-[#16803C] border-emerald-200' };
  }
  return { label: 'हुन बाँकी (Pending)', class: 'bg-amber-50 text-[#D97706] border-amber-200' };
}
