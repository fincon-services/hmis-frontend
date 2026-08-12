import { useMemo } from 'react';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { useItemCategories } from './ItemCategoriesPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface ItemSubCategory {
  id: number;
  warehouse_item_category_id: number;
  name: string;
  description: string | null;
}

const schema = z.object({
  warehouse_item_category_id: z.number({ required_error: 'Required' }),
  name: z.string().min(1, 'Required').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export const itemSubCategoriesApi = createCrudApi<ItemSubCategory, FormValues>('/warehouse/item-sub-categories', 'warehouse.catalog');
const hooks = createCrudHooks('warehouse.item-sub-categories', itemSubCategoriesApi);
export const useItemSubCategories = hooks.useList;

const columns: ColumnsType<ItemSubCategory> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Description', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v ?? '—' },
];

export function ItemSubCategoriesPage() {
  const categoriesQuery = useItemCategories({ per_page: 0 });
  const categoryOptions = useMemo(() => (categoriesQuery.data?.data ?? []).map((c) => ({ label: c.name, value: c.id })), [categoriesQuery.data]);

  const fields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'warehouse_item_category_id', label: 'Category', required: true, options: categoryOptions },
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'textarea', name: 'description', label: 'Description' },
  ];

  return (
    <CrudResourcePage<ItemSubCategory, FormValues>
      title="Item Sub-Categories"
      singularTitle="Item Sub-Category"
      screenKey="warehouse.catalog"
      breadcrumbs={[{ label: 'Warehouse' }, { label: 'Item Sub-Categories' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ warehouse_item_category_id: undefined as unknown as number, name: '', description: '' }}
      toFormValues={(r) => ({ warehouse_item_category_id: r.warehouse_item_category_id, name: r.name, description: r.description ?? '' })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
