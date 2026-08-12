import { createNameDescriptionResource } from '@/lib/crud/createNameDescriptionResource';

export const { api: itemAttributesApi, hooks: itemAttributesHooks, Page: ItemAttributesPage } = createNameDescriptionResource(
  '/warehouse/item-attributes',
  'warehouse.catalog',
  'Item Attributes',
  'Item Attribute',
  [{ label: 'Warehouse' }, { label: 'Item Attributes' }],
);
export const useItemAttributes = itemAttributesHooks.useList;
