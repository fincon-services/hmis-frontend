export interface NamedRef {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  cnic: string;
  photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    postal_code: string | null;
  };
  phone_home: string | null;
  phone_mobile: string | null;
  phone_work: string | null;
  email_work: string | null;
  email_personal: string | null;
  department: NamedRef | null;
  job_category: NamedRef | null;
  job_title: NamedRef | null;
  employment_status: NamedRef | null;
  education_level: NamedRef | null;
  reports_to: NamedRef | null;
  hire_date: string | null;
  termination_date: string | null;
  is_active: boolean;
  payment_type: string | null;
  bank_account_no: string | null;
  company_bank_account: { id: number; bank_name: string } | null;
  salary: { basic_salary: number; pay_frequency: string; pay_grade: { id: number; name: string } | null } | null;
  current_work_shift: { work_shift_id: number; name: string | null; month: number; year: number } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeRequest {
  employee_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  cnic: string;
}

export interface PersonalDetailsRequest {
  employee_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  cnic: string;
  education_level_id?: number;
  gender?: string;
  marital_status?: string;
  date_of_birth?: string;
}

export interface ContactDetailsRequest {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  phone_home?: string;
  phone_mobile?: string;
  phone_work?: string;
  email_work?: string;
  email_personal?: string;
}

export interface JobDetailsRequest {
  job_title_id: number;
  employment_status_id: number;
  job_category_id: number;
  department_id: number;
  hire_date: string;
  is_active: boolean;
  settlement_amount?: number;
}

export interface BankDetailsRequest {
  payment_type: string;
  bank_account_no?: string;
  company_bank_account_id?: number;
}

export interface EmployeeSalary {
  id: number;
  employee_id: number;
  pay_grade: { id: number; name: string } | null;
  pay_frequency: string;
  title: string | null;
  basic_salary: number;
  comments: string | null;
  is_attendance_exempt: boolean;
}

export interface SetSalaryRequest {
  pay_grade_id: number;
  pay_frequency: string;
  title?: string;
  basic_salary: number;
  comments?: string;
  is_attendance_exempt?: boolean;
}

export interface EmployeeWorkShiftAssignment {
  id: number;
  employee_id: number;
  work_shift_id: number;
  work_shift_name: string | null;
  month: number;
  year: number;
  month_hours: number | null;
  is_active: boolean;
}

export interface AssignWorkShiftRequest {
  work_shift_id: number;
  month: number;
  year: number;
}

export interface EmergencyContact {
  id: number;
  employee_id: number;
  name: string;
  relationship: string;
  home_phone: string | null;
  mobile_phone: string | null;
  office_phone: string | null;
}

export interface EmergencyContactRequest {
  name: string;
  relationship: string;
  home_phone?: string;
  mobile_phone?: string;
  office_phone?: string;
}

export interface Qualification {
  id: number;
  employee_id: number;
  education_level: string | null;
  institution_name: string;
  field_of_study: string | null;
  start_date: string | null;
  completion_date: string | null;
  grade: string | null;
  is_highest: boolean;
}

export interface QualificationRequest {
  education_level_id: number;
  institution_name: string;
  field_of_study?: string;
  start_date?: string;
  completion_date?: string;
  grade?: string;
  is_highest?: boolean;
}

export interface Experience {
  id: number;
  employee_id: number;
  organization_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface ExperienceRequest {
  organization_name: string;
  job_title: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface EmployeeLanguage {
  id: number;
  name: string;
  proficiency: string;
}

export interface LanguageRequest {
  language_id: number;
  proficiency: string;
}

export interface EmployeeSkill {
  id: number;
  name: string;
  proficiency: string;
}

export interface SkillRequest {
  skill_id: number;
  proficiency: string;
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_type: string;
  title: string;
  download_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface EmployeePosting {
  id: number;
  employee_id: number;
  department: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  reason: string | null;
}

export interface PostingRequest {
  department_id: number;
  start_date: string;
  end_date?: string;
  reason?: string;
}

export interface EmployeePromotion {
  id: number;
  employee_id: number;
  from_job_title: string | null;
  to_job_title: string;
  from_pay_grade: string | null;
  to_pay_grade: string;
  effective_date: string;
  remarks: string | null;
  approved_by: string | null;
}

export interface PromotionRequest {
  to_job_title_id: number;
  to_pay_grade_id: number;
  effective_date: string;
  remarks?: string;
  approved_by_user_id?: number;
}

export interface EmployeeTransfer {
  id: number;
  employee_id: number;
  from_department: string | null;
  to_department: string;
  effective_date: string;
  reason: string | null;
  approved_by: string | null;
}

export interface TransferRequest {
  to_department_id: number;
  effective_date: string;
  reason?: string;
  approved_by_user_id?: number;
}

export interface ServiceHistoryEvent {
  type: string;
  date: string | null;
  summary: string;
}

export interface EmployeeListParams {
  search?: string;
  is_active?: boolean;
  department_id?: number;
  per_page?: number;
  page?: number;
}
