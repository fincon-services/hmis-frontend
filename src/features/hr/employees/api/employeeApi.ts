import { apiClient } from '@/api/client';
import type { CollectionResponse, MessageResponse, PaginatedResponse } from '@/types/api';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import type {
  AssignWorkShiftRequest,
  BankDetailsRequest,
  ContactDetailsRequest,
  CreateEmployeeRequest,
  EmergencyContact,
  EmergencyContactRequest,
  Employee,
  EmployeeDocument,
  EmployeeListParams,
  EmployeePosting,
  EmployeePromotion,
  EmployeeSalary,
  EmployeeSkill,
  EmployeeTransfer,
  EmployeeWorkShiftAssignment,
  Experience,
  ExperienceRequest,
  JobDetailsRequest,
  LanguageRequest,
  EmployeeLanguage,
  PersonalDetailsRequest,
  PostingRequest,
  PromotionRequest,
  Qualification,
  QualificationRequest,
  ServiceHistoryEvent,
  SetSalaryRequest,
  SkillRequest,
  TransferRequest,
} from '../types/employee.types';

const SCREEN = 'pim.employees';

export const employeeApi = {
  list: (params: EmployeeListParams) =>
    apiClient
      .get<PaginatedResponse<Employee> | CollectionResponse<Employee>>('/pim/employees', { params, screenKey: SCREEN })
      .then((r) => r.data),

  search: (term: string) =>
    apiClient.get<CollectionResponse<Employee>>('/pim/employees/search', { params: { term }, screenKey: SCREEN }).then((r) => r.data.data),

  get: (id: number) => apiClient.get<Employee>(`/pim/employees/${id}`, { screenKey: SCREEN }).then((r) => r.data),

  create: (payload: CreateEmployeeRequest) => apiClient.post<Employee>('/pim/employees', payload, { screenKey: SCREEN }).then((r) => r.data),

  remove: (id: number) => apiClient.delete<MessageResponse>(`/pim/employees/${id}`, { screenKey: SCREEN }).then((r) => r.data),

  updatePersonalDetails: (id: number, payload: PersonalDetailsRequest) =>
    apiClient.put<Employee>(`/pim/employees/${id}/personal-details`, payload, { screenKey: SCREEN }).then((r) => r.data),

  updateContactDetails: (id: number, payload: ContactDetailsRequest) =>
    apiClient.put<Employee>(`/pim/employees/${id}/contact-details`, payload, { screenKey: SCREEN }).then((r) => r.data),

  updateJobDetails: (id: number, payload: JobDetailsRequest) =>
    apiClient.put<Employee>(`/pim/employees/${id}/job-details`, payload, { screenKey: SCREEN }).then((r) => r.data),

  updateBankDetails: (id: number, payload: BankDetailsRequest) =>
    apiClient.put<Employee>(`/pim/employees/${id}/bank-details`, payload, { screenKey: SCREEN }).then((r) => r.data),

  getSalary: (id: number) => apiClient.get<EmployeeSalary | null>(`/pim/employees/${id}/salary`, { screenKey: SCREEN }).then((r) => r.data),

  setSalary: (id: number, payload: SetSalaryRequest) =>
    apiClient.post<EmployeeSalary>(`/pim/employees/${id}/salary`, payload, { screenKey: SCREEN }).then((r) => r.data),

  listWorkShifts: (id: number) =>
    apiClient
      .get<CollectionResponse<EmployeeWorkShiftAssignment>>(`/pim/employees/${id}/work-shifts`, { screenKey: SCREEN })
      .then((r) => r.data.data),

  assignWorkShift: (id: number, payload: AssignWorkShiftRequest) =>
    apiClient.post<EmployeeWorkShiftAssignment>(`/pim/employees/${id}/work-shifts`, payload, { screenKey: SCREEN }).then((r) => r.data),

  removeWorkShift: (employeeId: number, workShiftAssignmentId: number) =>
    apiClient.delete<MessageResponse>(`/pim/employees/${employeeId}/work-shifts/${workShiftAssignmentId}`, { screenKey: SCREEN }).then((r) => r.data),

  listDocuments: (id: number) =>
    apiClient.get<CollectionResponse<EmployeeDocument>>(`/pim/employees/${id}/documents`, { screenKey: SCREEN }).then((r) => r.data.data),

  uploadDocument: (id: number, file: File, documentType: string, title: string, onProgress: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('title', title);
    return apiClient
      .post<EmployeeDocument>(`/pim/employees/${id}/documents`, formData, {
        screenKey: SCREEN,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  deleteDocument: (employeeId: number, documentId: number) =>
    apiClient.delete<MessageResponse>(`/pim/employees/${employeeId}/documents/${documentId}`, { screenKey: SCREEN }).then((r) => r.data),

  downloadDocument: async (employeeId: number, documentId: number, fileName: string) => {
    const response = await apiClient.get<Blob>(`/pim/employees/${employeeId}/documents/${documentId}/download`, {
      screenKey: SCREEN,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  listTransfers: (id: number) =>
    apiClient.get<CollectionResponse<EmployeeTransfer>>(`/pim/employees/${id}/transfers`, { screenKey: SCREEN }).then((r) => r.data.data),

  recordTransfer: (id: number, payload: TransferRequest) =>
    apiClient.post<EmployeeTransfer>(`/pim/employees/${id}/transfers`, payload, { screenKey: SCREEN }).then((r) => r.data),

  listPromotions: (id: number) =>
    apiClient.get<CollectionResponse<EmployeePromotion>>(`/pim/employees/${id}/promotions`, { screenKey: SCREEN }).then((r) => r.data.data),

  recordPromotion: (id: number, payload: PromotionRequest) =>
    apiClient.post<EmployeePromotion>(`/pim/employees/${id}/promotions`, payload, { screenKey: SCREEN }).then((r) => r.data),

  serviceHistory: (id: number) =>
    apiClient.get<ServiceHistoryEvent[]>(`/pim/employees/${id}/service-history`, { screenKey: SCREEN }).then((r) => r.data),
};

// Standard nested CRUD sub-resources — factory-created per employee id (see InlineSubResourceCrud usage).
export const createEmergencyContactsApi = (employeeId: number) =>
  createCrudApi<EmergencyContact, EmergencyContactRequest>(`/pim/employees/${employeeId}/emergency-contacts`, SCREEN);

export const createQualificationsApi = (employeeId: number) =>
  createCrudApi<Qualification, QualificationRequest>(`/pim/employees/${employeeId}/qualifications`, SCREEN);

export const createExperiencesApi = (employeeId: number) =>
  createCrudApi<Experience, ExperienceRequest>(`/pim/employees/${employeeId}/experiences`, SCREEN);

export const createLanguagesApi = (employeeId: number) =>
  createCrudApi<EmployeeLanguage, LanguageRequest>(`/pim/employees/${employeeId}/languages`, SCREEN);

export const createSkillsApi = (employeeId: number) =>
  createCrudApi<EmployeeSkill, SkillRequest>(`/pim/employees/${employeeId}/skills`, SCREEN);

export const createPostingsApi = (employeeId: number) =>
  createCrudApi<EmployeePosting, PostingRequest>(`/pim/employees/${employeeId}/postings`, SCREEN);
