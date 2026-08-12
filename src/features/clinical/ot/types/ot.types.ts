export interface OtProcedure {
  id: number;
  name: string;
  is_active: boolean;
}

export interface OtSchedule {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  ot_procedure_id: number;
  ot_procedure_name: string | null;
  scheduled_date: string;
  is_referred: boolean;
}

export type AnesthesiaType = 'general' | 'local';

export interface PatientSurgery {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  ot_procedure_id: number;
  ot_procedure_name: string | null;
  anesthesia_type: AnesthesiaType;
  category: number | null;
  performed_at: string | null;
  days_from_admit: number | null;
}

export interface ScheduleSurgeryRequest {
  ot_procedure_id: number;
  scheduled_date: string;
}

export interface RecordSurgeryRequest {
  ot_procedure_id: number;
  anesthesia_type: AnesthesiaType;
  category?: number;
  performed_at?: string;
  days_from_admit?: number;
}

export interface SurgicalProcedureStatistic {
  id: number;
  month: string;
  gynae_ga: number;
  gynae_la: number;
  general_surgery_ga: number;
  general_surgery_la: number;
  ent_ga: number;
  ent_la: number;
  eye_ga: number;
  eye_la: number;
  accident_trauma_ga: number;
  accident_trauma_la: number;
  other_ga: number;
  other_la: number;
  total_ga: number;
  total_la: number;
}
