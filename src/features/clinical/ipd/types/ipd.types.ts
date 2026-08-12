import type { Patient } from '@/features/patients/types/patient.types';

export interface Ward {
  id: number;
  name: string;
  code: string;
  total_beds: number;
  occupied_beds: number | null;
}

export interface WardBed {
  id: number;
  ward_id: number;
  bed_no: string;
  is_occupied: boolean;
}

export interface WardAdmission {
  id: number;
  patient?: Patient;
  patient_id: number;
  opd_visit_id: number;
  ward_id: number;
  ward_name: string | null;
  bed_id: number;
  bed_no: string | null;
  doctor_user_id: number | null;
  is_discharged: boolean;
  admitted_at: string;
}

export interface AdmitPatientRequest {
  ward_id: number;
  bed_id: number;
  doctor_user_id?: number;
}

export interface TransferPatientRequest {
  ward_id: number;
  bed_id: number;
}

export interface DischargePatientRequest {
  discharge_notes?: string;
  treatment_advice?: string;
  discharge_level?: string;
  death_reason?: string;
  discharge_date?: string;
}
