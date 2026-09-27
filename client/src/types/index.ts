export type IncidentType = 'death' | 'missing' | 'injured' | 'disabled' | 'other';
export type GenderType = 'male' | 'female' | 'other';
export type YesNoType = 'yes' | 'no';
export type SearchStatusType = 'ongoing' | 'suspended' | 'found';
export type ConditionType = 'under_treatment' | 'recovered' | 'further_treatment_needed';
export type VerificationType = 'verified' | 'pending';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface IncidentRecord {
  id: number;
  record_code: string;
  form_number?: string | null;
  district: string;
  municipality: string;
  ward_number?: number | null;
  location?: string | null;
  collection_date: string;

  full_name: string;
  age?: number | null;
  gender: GenderType;
  family_contact?: string | null;
  phone?: string | null;

  incident_type: IncidentType;
  other_incident_type?: string | null;
  incident_date?: string | null;
  incident_location?: string | null;
  incident_description?: string | null;

  body_found?: YesNoType | null;
  identified?: YesNoType | null;
  search_status?: SearchStatusType | null;
  family_informed?: YesNoType | null;

  injury_type?: string | null;
  treatment_location?: string | null;
  current_condition?: ConditionType | null;

  is_child: boolean | number;
  child_guardian_lost?: boolean | number;
  child_separated_from_family?: boolean | number;
  child_school_affected?: boolean | number;
  child_other?: string | null;

  is_woman: boolean | number;
  is_pregnant?: boolean | number;
  is_postpartum?: boolean | number;
  is_single_woman?: boolean | number;
  is_woman_led_family?: boolean | number;
  woman_other?: string | null;

  verification_status: VerificationType;
  verified_by?: string | null;
  data_collector?: string | null;
  signature_info?: string | null;
  collection_sign_date?: string | null;

  created_by?: number | null;
  updated_by?: number | null;
  creator_name?: string | null;
  updater_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean | number;
  is_verified?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface UserAuditLog {
  id: number;
  action: string;
  performed_by_user_id?: number | null;
  performed_by_name: string;
  affected_user_id?: number | null;
  affected_user_name: string;
  affected_user_email: string;
  affected_user_role: string;
  description?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface UserAuditLogsResponse {
  success: boolean;
  data: UserAuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  total_records: number;
  total_deaths: number;
  total_missing: number;
  total_injured: number;
  total_other: number;
  total_children: number;
  total_women: number;
  total_verified: number;
  total_pending: number;
  total_unidentified: number;
  total_bodies_found: number;
  total_under_treatment: number;
}

export interface StatsResponse {
  success?: boolean;
  stats: DashboardStats;
  charts: {
    byDistrict: { district: string; count: number }[];
    byType: { incident_type: IncidentType; count: number }[];
    byGender: { gender: GenderType; count: number }[];
    vulnerabilities: {
      child_guardian_lost: number;
      child_separated: number;
      child_school_affected: number;
      pregnant_women: number;
      postpartum_women: number;
      single_women: number;
      woman_led_family: number;
    };
  };
  recentLogs?: {
    id: number;
    user_email: string;
    user_role: string;
    action: string;
    record_id: number;
    created_at: string;
  }[];
}

export interface FilterParams {
  search?: string;
  district?: string;
  municipality?: string;
  incident_type?: string;
  gender?: string;
  is_child?: string;
  is_woman?: string;
  verification_status?: string;
  body_found?: string;
  identified?: string;
  search_status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'ASC' | 'DESC';
}
