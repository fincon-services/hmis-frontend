import type { Origin, Patient } from '@/features/patients/types/patient.types';

/** Matches VitalTypeResource — 'blood_pressure' renders as Systolic/Diastolic sub-fields, everything else is a single numeric value. */
export type VitalValueType = 'numeric' | 'blood_pressure';

export interface VitalType {
  id: number;
  name: string;
  applies_to_opd: boolean;
  applies_to_er: boolean;
  applies_to_ipd: boolean;
  is_active: boolean;
  value_type: VitalValueType;
  /** Systolic lower bound for blood_pressure types, or the only lower bound for numeric types. Null = unconfigured/unbounded. */
  min_value: number | null;
  max_value: number | null;
  /** Diastolic bounds — only meaningful when value_type is 'blood_pressure'. */
  min_value_secondary: number | null;
  max_value_secondary: number | null;
  unit: string | null;
}

export interface PatientVital {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  vital_type_id: number;
  vital_type_name: string | null;
  value: string;
  recorded_by_user_id: number;
  created_at: string;
}

export interface NurseQueueEntry {
  opd_visit_id: number;
  patient: Patient;
  origin: Origin;
  visit_date: string;
  is_follow_up: boolean;
}

export interface WeightRange {
  id: number;
  start_days: number;
  end_days: number;
  start_weight: number;
  end_weight: number;
}

export interface RecordVitalsRequest {
  vitals: Record<string, string>;
}

export interface VitalsQueueParams {
  origin: Origin;
  date?: string;
  search?: string;
  per_page?: number;
  page?: number;
}
