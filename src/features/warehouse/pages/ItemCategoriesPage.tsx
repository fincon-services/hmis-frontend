import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface ItemCategory {
  id: number;
  name: string;
  description: string | null;
  enforces_expiry: boolean;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
  enforces_expiry: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const itemCategoriesApi = createCrudApi<ItemCategory, FormValues>('/warehouse/item-categories', 'warehouse.catalog');
const hooks = createCrudHooks('warehouse.item-categories', itemCategoriesApi);
export const useItemCategories = hooks.useList;

const columns: ColumnsType<ItemCategory> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Description', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v ?? '—' },
  { title: 'Enforces Expiry', dataIndex: 'enforces_expiry', width: 140, render: (v: boolean) => (v ? 'Yes' : 'No') },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description' },
  { type: 'switch', name: 'enforces_expiry', label: 'Enforces Expiry Tracking' },
];

export function ItemCategoriesPage() {
  return (
    <CrudResourcePage<ItemCategory, FormValues>
      title="Item Categories"
      singularTitle="Item Category"
      screenKey="warehouse.catalog"
      breadcrumbs={[{ label: 'Warehouse' }, { label: 'Item Categories' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', description: '', enforces_expiry: false }}
      toFormValues={(r) => ({ name: r.name, description: r.description ?? '', enforces_expiry: r.enforces_expiry })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
