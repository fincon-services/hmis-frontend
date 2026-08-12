import type { Origin, Patient } from '@/features/patients/types/patient.types';

export interface VitalType {
  id: number;
  name: string;
  applies_to_opd: boolean;
  applies_to_er: boolean;
  applies_to_ipd: boolean;
  is_active: boolean;
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
