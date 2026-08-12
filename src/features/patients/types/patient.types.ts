export type Origin = 'OPD' | 'ER';
export type Gender = 'male' | 'female';
export type AgeType = 'years' | 'months' | 'days';

/** The API returns age as a {value, unit} pair, not a scalar — confirmed against a live /patients/{id} response (not documented in Swagger). */
export interface PatientAge {
  value: number;
  unit: AgeType;
}

export function formatPatientAge(age: PatientAge): string {
  return `${age.value} ${age.unit}`;
}

export interface Patient {
  id: number;
  mr_no: string;
  name: string;
  gender: Gender;
  date_of_birth: string | null;
  age: PatientAge;
  address: string | null;
  guardian_name: string;
  guardian_cnic: string | null;
  guardian_phone: string | null;
  referred_from: string | null;
  origin: Origin;
  registration_date: string;
  current_origin?: Origin;
  /** Confirmed via live response to be a numeric string (e.g. "1"), not a number. */
  created_by_user_id: string;
}

export interface OpdVisit {
  id: number;
  patient_id: number;
  visit_date: string;
  origin: Origin;
  is_follow_up: boolean;
  created_by_user_id: number;
}

export interface PatientReferral {
  id: number;
  patient?: Patient;
  patient_id: number;
  opd_visit_id: number;
  referred_by: string;
  referred_to: string;
  processed: boolean;
  created_at: string;
}

export interface RegisterPatientRequest {
  name: string;
  gender: Gender;
  age: number;
  age_type: AgeType;
  guardian_name: string;
  guardian_phone?: string;
  guardian_cnic?: string;
  address?: string;
  referred_from?: string;
  origin: Origin;
}

export interface UpdatePatientRequest {
  name?: string;
  gender?: Gender;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_cnic?: string;
  address?: string;
  referred_from?: string;
}

export interface RecordVisitRequest {
  origin: Origin;
  name?: string;
  gender?: Gender;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_cnic?: string;
  address?: string;
}

export interface ReferPatientRequest {
  referred_by: string;
  referred_to: string;
}

export interface QueuedReferral {
  id: number;
  patient: Patient;
  patient_id: number;
  opd_visit_id: number;
  referred_by: string;
  referred_to: string;
  processed: boolean;
  created_at: string;
}

export interface PatientQueueParams {
  origin: Origin;
  referred_to: string;
  date?: string;
}

export interface PatientListParams {
  search?: string;
  origin?: Origin;
  sort?: string;
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}
