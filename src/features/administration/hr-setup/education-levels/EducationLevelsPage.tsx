import { createSimpleNameResource } from '@/lib/crud/createSimpleNameResource';

export const { api: educationLevelsApi, hooks: educationLevelsHooks, Page: EducationLevelsPage } = createSimpleNameResource(
  '/admin/education-levels',
  'admin.education-levels',
  'Education Levels',
  'Education Level',
  [{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Education Levels' }],
);
export const useEducationLevels = educationLevelsHooks.useList;
