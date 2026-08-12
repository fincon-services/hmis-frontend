import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { VitalType } from '../types/vitals.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  applies_to_opd: z.boolean(),
  applies_to_er: z.boolean(),
  applies_to_ipd: z.boolean(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const vitalTypesApi = createCrudApi<VitalType, FormValues>('/vitals/types', 'vitals.types');
const hooks = createCrudHooks('vitals.types', vitalTypesApi);
export const useVitalTypes = hooks.useList;

function YesNo({ value }: { value: boolean }) {
  return <span>{value ? 'Yes' : 'No'}</span>;
}

const columns: ColumnsType<VitalType> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'OPD', dataIndex: 'applies_to_opd', width: 70, render: (v: boolean) => <YesNo value={v} /> },
  { title: 'ER', dataIndex: 'applies_to_er', width: 70, render: (v: boolean) => <YesNo value={v} /> },
  { title: 'IPD', dataIndex: 'applies_to_ipd', width: 70, render: (v: boolean) => <YesNo value={v} /> },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 110,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Temperature' },
  { type: 'switch', name: 'applies_to_opd', label: 'Applies to OPD' },
  { type: 'switch', name: 'applies_to_er', label: 'Applies to ER' },
  { type: 'switch', name: 'applies_to_ipd', label: 'Applies to IPD' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function VitalTypesPage() {
  return (
    <CrudResourcePage<VitalType, FormValues>
      title="Vital Types"
      singularTitle="Vital Type"
      screenKey="vitals.types"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Vitals' }, { label: 'Vital Types' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', applies_to_opd: true, applies_to_er: true, applies_to_ipd: false, is_active: true }}
      toFormValues={(r) => ({
        name: r.name,
        applies_to_opd: r.applies_to_opd,
        applies_to_er: r.applies_to_er,
        applies_to_ipd: r.applies_to_ipd,
        is_active: r.is_active,
      })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
