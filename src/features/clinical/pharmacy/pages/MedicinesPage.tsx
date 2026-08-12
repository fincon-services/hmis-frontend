import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { Medicine } from '../types/pharmacy.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  warehouse_item_id: z.number().optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const medicinesApi = createCrudApi<Medicine, FormValues>('/pharmacy/medicines', 'pharmacy.catalog');
const hooks = createCrudHooks('pharmacy.medicines', medicinesApi);
export const useMedicines = hooks.useList;

const columns: ColumnsType<Medicine> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Warehouse Item ID', dataIndex: 'warehouse_item_id', render: (v: number | null) => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Paracetamol 500mg' },
  {
    type: 'number',
    name: 'warehouse_item_id',
    label: 'Warehouse Item ID',
    min: 1,
    helpText: 'Optional — links to a warehouse stock item for FEFO-tracked dispensing. Warehouse item lookup is not yet available in this UI; enter the ID directly.',
  },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function MedicinesPage() {
  return (
    <CrudResourcePage<Medicine, FormValues>
      title="Medicines"
      singularTitle="Medicine"
      screenKey="pharmacy.catalog"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Pharmacy' }, { label: 'Medicines' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', warehouse_item_id: undefined, is_active: true }}
      toFormValues={(r) => ({ name: r.name, warehouse_item_id: r.warehouse_item_id ?? undefined, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
