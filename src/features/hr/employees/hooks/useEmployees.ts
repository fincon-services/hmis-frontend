import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { queryClient } from '@/api/queryClient';
import type {
  AssignWorkShiftRequest,
  BankDetailsRequest,
  ContactDetailsRequest,
  CreateEmployeeRequest,
  EmployeeListParams,
  JobDetailsRequest,
  PersonalDetailsRequest,
  PromotionRequest,
  SetSalaryRequest,
  TransferRequest,
} from '../types/employee.types';

export const employeeKeys = {
  list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
  detail: (id: number) => ['employees', 'detail', id] as const,
  salary: (id: number) => ['employees', id, 'salary'] as const,
  workShifts: (id: number) => ['employees', id, 'work-shifts'] as const,
  documents: (id: number) => ['employees', id, 'documents'] as const,
  transfers: (id: number) => ['employees', id, 'transfers'] as const,
  promotions: (id: number) => ['employees', id, 'promotions'] as const,
  serviceHistory: (id: number) => ['employees', id, 'service-history'] as const,
};

export function useEmployees(params: EmployeeListParams) {
  return useQuery({ queryKey: employeeKeys.list(params), queryFn: () => employeeApi.list(params), placeholderData: keepPreviousData });
}

export function useEmployee(id: number) {
  return useQuery({ queryKey: employeeKeys.detail(id), queryFn: () => employeeApi.get(id), enabled: !!id });
}

export function useCreateEmployee() {
  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => employeeApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees', 'list'] }),
  });
}

function invalidateEmployee(id: number) {
  queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: ['employees', 'list'] });
}

export function useUpdatePersonalDetails(id: number) {
  return useMutation({ mutationFn: (payload: PersonalDetailsRequest) => employeeApi.updatePersonalDetails(id, payload), onSuccess: () => invalidateEmployee(id) });
}

export function useUpdateContactDetails(id: number) {
  return useMutation({ mutationFn: (payload: ContactDetailsRequest) => employeeApi.updateContactDetails(id, payload), onSuccess: () => invalidateEmployee(id) });
}

export function useUpdateJobDetails(id: number) {
  return useMutation({ mutationFn: (payload: JobDetailsRequest) => employeeApi.updateJobDetails(id, payload), onSuccess: () => invalidateEmployee(id) });
}

export function useUpdateBankDetails(id: number) {
  return useMutation({ mutationFn: (payload: BankDetailsRequest) => employeeApi.updateBankDetails(id, payload), onSuccess: () => invalidateEmployee(id) });
}

export function useEmployeeSalary(id: number) {
  return useQuery({ queryKey: employeeKeys.salary(id), queryFn: () => employeeApi.getSalary(id), enabled: !!id });
}

export function useSetSalary(id: number) {
  return useMutation({
    mutationFn: (payload: SetSalaryRequest) => employeeApi.setSalary(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.salary(id) });
      invalidateEmployee(id);
    },
  });
}

export function useEmployeeWorkShifts(id: number) {
  return useQuery({ queryKey: employeeKeys.workShifts(id), queryFn: () => employeeApi.listWorkShifts(id), enabled: !!id });
}

export function useAssignWorkShift(id: number) {
  return useMutation({
    mutationFn: (payload: AssignWorkShiftRequest) => employeeApi.assignWorkShift(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.workShifts(id) }),
  });
}

export function useRemoveWorkShift(id: number) {
  return useMutation({
    mutationFn: (workShiftAssignmentId: number) => employeeApi.removeWorkShift(id, workShiftAssignmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.workShifts(id) }),
  });
}

export function useEmployeeDocuments(id: number) {
  return useQuery({ queryKey: employeeKeys.documents(id), queryFn: () => employeeApi.listDocuments(id), enabled: !!id });
}

export function useDeleteDocument(id: number) {
  return useMutation({
    mutationFn: (documentId: number) => employeeApi.deleteDocument(id, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.documents(id) }),
  });
}

export function useEmployeeTransfers(id: number) {
  return useQuery({ queryKey: employeeKeys.transfers(id), queryFn: () => employeeApi.listTransfers(id), enabled: !!id });
}

export function useRecordTransfer(id: number) {
  return useMutation({
    mutationFn: (payload: TransferRequest) => employeeApi.recordTransfer(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.transfers(id) }),
  });
}

export function useEmployeePromotions(id: number) {
  return useQuery({ queryKey: employeeKeys.promotions(id), queryFn: () => employeeApi.listPromotions(id), enabled: !!id });
}

export function useRecordPromotion(id: number) {
  return useMutation({
    mutationFn: (payload: PromotionRequest) => employeeApi.recordPromotion(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.promotions(id) }),
  });
}

export function useServiceHistory(id: number) {
  return useQuery({ queryKey: employeeKeys.serviceHistory(id), queryFn: () => employeeApi.serviceHistory(id), enabled: !!id });
}
