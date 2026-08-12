export interface RadiologyTest {
  id: number;
  name: string;
  is_active: boolean;
}

export interface PatientRadiologyResult {
  id: number;
  patient_radiology_prescription_id: number;
  view_number: number;
  description: string | null;
  file_name: string;
  created_at: string;
}

export interface PatientRadiologyPrescription {
  id: number;
  patient_id: number;
  opd_visit_id: number;
  radiology_test_id: number;
  radiology_test_name: string | null;
  prescribed_by: string;
  is_resulted: boolean;
  results: PatientRadiologyResult[];
  created_at: string;
}

export interface PrescribeRadiologyTestsRequest {
  radiology_test_ids: number[];
  prescribed_by: string;
}
