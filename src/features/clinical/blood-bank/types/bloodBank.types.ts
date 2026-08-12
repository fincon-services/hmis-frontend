import type { AgeType } from '@/features/patients/types/patient.types';
import type { SpecimenStatus } from '@/features/clinical/laboratory/types/laboratory.types';

export type { SpecimenStatus };

export interface BloodScreeningTestResult {
  id: number;
  parameter_id: number;
  value: string;
}

export interface BloodScreeningTest {
  id: number;
  blood_bag_id: number;
  lab_test_id: number;
  lab_test_name: string | null;
  specimen_status: SpecimenStatus;
  specimen_no: string | null;
  is_resulted: boolean;
  result_notes: string | null;
  results: BloodScreeningTestResult[];
  created_at: string;
}

export interface BloodDonorScreening {
  id: number;
  blood_bag_id: number;
  hbs_ag: string | null;
  vdrl: string | null;
  mp: string | null;
  hcv: string | null;
  hiv: string | null;
  is_cleared: boolean | null;
  remarks: string | null;
  screened_at: string;
}

export interface BloodBag {
  id: number;
  blood_group: string;
  quantity: number;
  original_quantity: number;
  donor_status: string | null;
  donor_name: string | null;
  donor_cnic: string | null;
  donor_age: number | null;
  age_type: AgeType | null;
  patient_id: number | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  gender: string | null;
  address: string | null;
  bag_number: string | null;
  expiry_date: string | null;
  last_donation_date: string | null;
  is_pre_screened: boolean;
  is_screening_cleared: boolean;
  remarks: string | null;
  specimen_no: string | null;
  collected_at: string;
  screening_tests: BloodScreeningTest[];
  donor_screening: BloodDonorScreening | null;
}

export interface ReceiveBloodBagRequest {
  blood_group: string;
  original_quantity: number;
  donor_status?: string;
  donor_name?: string;
  donor_cnic?: string;
  donor_age?: number;
  age_type?: AgeType;
  patient_id?: number;
  guardian_name?: string;
  guardian_phone?: string;
  gender?: string;
  address?: string;
  bag_number?: string;
  expiry_date?: string;
  last_donation_date?: string;
  is_pre_screened?: boolean;
  remarks?: string;
  specimen_no?: string;
}

export interface DiscardBloodRequest {
  quantity: number;
  remarks: string;
}

export interface IssueBloodRequest {
  patient_id: number;
  patient_prescription: string;
  quantity: number;
}

export interface BloodIssue {
  id: number;
  blood_bag_id: number;
  patient_id: number;
  patient_prescription: string;
  quantity: number;
  issued_by_user_id: number;
  created_at: string;
}

export interface BloodDiscard {
  id: number;
  blood_bag_id: number;
  quantity: number;
  remarks: string;
  discarded_by_user_id: number;
  created_at: string;
}

export interface SaveDonorScreeningRequest {
  hbs_ag?: string;
  vdrl?: string;
  mp?: string;
  hcv?: string;
  hiv?: string;
  is_cleared?: boolean;
  remarks?: string;
}

export interface BloodGroupReport {
  blood_group: string;
  total_bags: number;
  total_quantity: number;
  issued_quantity: number;
  remaining_quantity: number;
  expired_quantity: number;
  last_expiry_date: string | null;
}
