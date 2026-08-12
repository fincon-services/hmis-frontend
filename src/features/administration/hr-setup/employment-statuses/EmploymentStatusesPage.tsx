import { createSimpleNameResource } from '@/lib/crud/createSimpleNameResource';

export const { api: employmentStatusesApi, hooks: employmentStatusesHooks, Page: EmploymentStatusesPage } = createSimpleNameResource(
  '/admin/employment-statuses',
  'admin.employment-statuses',
  'Employment Statuses',
  'Employment Status',
  [{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Employment Statuses' }],
);
export const useEmploymentStatuses = employmentStatusesHooks.useList;
