import { createSimpleNameResource } from '@/lib/crud/createSimpleNameResource';

export const { api: languagesApi, hooks: languagesHooks, Page: LanguagesPage } = createSimpleNameResource(
  '/admin/languages',
  'admin.languages',
  'Languages',
  'Language',
  [{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Languages' }],
);
export const useLanguages = languagesHooks.useList;
