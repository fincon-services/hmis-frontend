export interface DiagnosisType {
  id: number;
  name: string;
  applies_to_opd: boolean;
  applies_to_er: boolean;
  applies_to_ipd: boolean;
  is_active: boolean;
}

export interface PatientConsultation {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  medical_history: string | null;
  complains: string | null;
  prescription: string | null;
  prescribed_by: string;
  recorded_by_user_id: number;
  created_at: string;
}

export type DiagnosisClass = 'provisional' | 'final';

export interface PatientDiagnosis {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  diagnosis_type_id: number;
  diagnosis_type_name: string | null;
  diagnosis_type: DiagnosisClass;
  diagnosed_by: string;
  diagnosed_by_user_id: number;
  created_at: string;
}

export interface RecordConsultationRequest {
  medical_history?: string;
  complains?: string;
  prescription?: string;
  prescribed_by: string;
}

export interface RecordDiagnosesRequest {
  diagnosis_type_ids: number[];
  diagnosis_type: DiagnosisClass;
  diagnosed_by: string;
}
