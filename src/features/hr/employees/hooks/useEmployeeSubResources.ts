import { useMemo } from 'react';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import {
  createEmergencyContactsApi,
  createExperiencesApi,
  createLanguagesApi,
  createPostingsApi,
  createQualificationsApi,
  createSkillsApi,
} from '../api/employeeApi';

export function useEmergencyContactHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`emergency-contacts-${employeeId}`, createEmergencyContactsApi(employeeId)), [employeeId]);
}

export function useQualificationHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`qualifications-${employeeId}`, createQualificationsApi(employeeId)), [employeeId]);
}

export function useExperienceHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`experiences-${employeeId}`, createExperiencesApi(employeeId)), [employeeId]);
}

export function useLanguageHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`languages-${employeeId}`, createLanguagesApi(employeeId)), [employeeId]);
}

export function useSkillHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`skills-${employeeId}`, createSkillsApi(employeeId)), [employeeId]);
}

export function usePostingHooks(employeeId: number) {
  return useMemo(() => createCrudHooks(`postings-${employeeId}`, createPostingsApi(employeeId)), [employeeId]);
}
