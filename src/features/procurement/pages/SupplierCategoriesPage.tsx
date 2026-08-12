import { createNameDescriptionResource } from '@/lib/crud/createNameDescriptionResource';

export const { api: supplierCategoriesApi, hooks: supplierCategoriesHooks, Page: SupplierCategoriesPage } = createNameDescriptionResource(
  '/procurement/supplier-categories',
  'procurement.suppliers',
  'Supplier Categories',
  'Supplier Category',
  [{ label: 'Procurement' }, { label: 'Supplier Categories' }],
);
export const useSupplierCategories = supplierCategoriesHooks.useList;
