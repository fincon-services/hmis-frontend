import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { SideEffectType } from '../types/pharmacy.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({ name: z.string().min(1, 'Name is required').max(150), is_active: z.boolean() });
type FormValues = z.infer<typeof schema>;

export const sideEffectTypesApi = createCrudApi<SideEffectType, FormValues>('/pharmacy/side-effect-types', 'pharmacy.catalog');
const hooks = createCrudHooks('pharmacy.side-effect-types', sideEffectTypesApi);
export const useSideEffectTypes = hooks.useList;

const columns: ColumnsType<SideEffectType> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Nausea' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function SideEffectTypesPage() {
  return (
    <CrudResourcePage<SideEffectType, FormValues>
      title="Side Effect Types"
      singularTitle="Side Effect Type"
      screenKey="pharmacy.catalog"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Pharmacy' }, { label: 'Side Effect Types' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', is_active: true }}
      toFormValues={(r) => ({ name: r.name, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
