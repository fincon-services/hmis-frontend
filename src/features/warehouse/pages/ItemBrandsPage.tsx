import { createNameDescriptionResource } from '@/lib/crud/createNameDescriptionResource';

export const { api: itemBrandsApi, hooks: itemBrandsHooks, Page: ItemBrandsPage } = createNameDescriptionResource(
  '/warehouse/item-brands',
  'warehouse.catalog',
  'Item Brands',
  'Item Brand',
  [{ label: 'Warehouse' }, { label: 'Item Brands' }],
);
export const useItemBrands = itemBrandsHooks.useList;
