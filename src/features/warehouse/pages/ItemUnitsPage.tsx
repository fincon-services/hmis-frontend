import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface ItemUnit {
  id: number;
  name: string;
  symbol: string | null;
  description: string | null;
}

const schema = z.object({
  name: z.string().min(1, 'Required').max(150),
  symbol: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export const itemUnitsApi = createCrudApi<ItemUnit, FormValues>('/warehouse/item-units', 'warehouse.catalog');
const hooks = createCrudHooks('warehouse.item-units', itemUnitsApi);
export const useItemUnits = hooks.useList;

const columns: ColumnsType<ItemUnit> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Symbol', dataIndex: 'symbol', width: 100, render: (v: string | null) => v ?? '—' },
  { title: 'Description', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v ?? '—' },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Tablets' },
  { type: 'text', name: 'symbol', label: 'Symbol', placeholder: 'tab' },
  { type: 'textarea', name: 'description', label: 'Description' },
];

export function ItemUnitsPage() {
  return (
    <CrudResourcePage<ItemUnit, FormValues>
      title="Item Units"
      singularTitle="Item Unit"
      screenKey="warehouse.catalog"
      breadcrumbs={[{ label: 'Warehouse' }, { label: 'Item Units' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', symbol: '', description: '' }}
      toFormValues={(r) => ({ name: r.name, symbol: r.symbol ?? '', description: r.description ?? '' })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
