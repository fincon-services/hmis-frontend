export interface LabTestCategory {
  id: number;
  name: string;
  is_active: boolean;
}

export interface LabTest {
  id: number;
  name: string;
  lab_test_category_id: number;
  category_name: string | null;
  is_active: boolean;
}

export interface LabTestParameter {
  id: number;
  lab_test_id: number;
  parameter_name: string;
  parameter_display_name: string;
  parameter_value: string | null;
  fixed_val: string | null;
}

export type SpecimenStatus = 'pending' | 'received' | 'result';

export interface PatientLabTestPrescription {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  lab_test_id: number;
  lab_test_name: string | null;
  prescribed_by: string;
  specimen_status: SpecimenStatus;
  specimen_no: string | null;
  is_resulted: boolean;
  result_notes: string | null;
  created_at: string;
}

export interface PrescribeLabTestsRequest {
  lab_test_ids: number[];
  prescribed_by: string;
}

export interface PrescribeLabTestsResponse {
  created: PatientLabTestPrescription[];
  already_prescribed: string[];
}

export interface RecordSpecimenRequest {
  specimen_no: string;
}

export interface LabResultValue {
  parameter_id: number;
  value: string;
}

export interface LabResultEntry {
  prescription_id: number;
  specimen_status: SpecimenStatus;
  result_notes?: string;
  values?: LabResultValue[];
}

export interface SaveLabResultsRequest {
  results: LabResultEntry[];
}
