import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { BedDouble } from 'lucide-react';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { Ward } from '../types/ipd.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  code: z.string().min(1, 'Code is required').max(20),
  total_beds: z.number({ required_error: 'Total beds is required' }).min(1),
});
type FormValues = z.infer<typeof schema>;

export const wardsApi = createCrudApi<Ward, FormValues>('/ipd/wards', 'ipd.wards');
const hooks = createCrudHooks('ipd.wards', wardsApi);
export const useWards = hooks.useList;

const columns: ColumnsType<Ward> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Code', dataIndex: 'code', width: 100 },
  { title: 'Total Beds', dataIndex: 'total_beds', width: 110 },
  { title: 'Occupied', key: 'occupied', width: 110, render: (_, r) => `${r.occupied_beds ?? 0} / ${r.total_beds}` },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'General Ward' },
  { type: 'text', name: 'code', label: 'Code', required: true, placeholder: 'GW' },
  { type: 'number', name: 'total_beds', label: 'Total Beds', required: true, min: 1 },
];

export function WardsPage() {
  const navigate = useNavigate();

  return (
    <CrudResourcePage<Ward, FormValues>
      title="Wards"
      singularTitle="Ward"
      screenKey="ipd.wards"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'IPD' }, { label: 'Wards' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', code: '', total_beds: 10 }}
      toFormValues={(r) => ({ name: r.name, code: r.code, total_beds: r.total_beds })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
      extraRowActions={(record) => [
        {
          key: 'view',
          label: 'View Beds & Admissions',
          icon: <BedDouble size={14} />,
          onClick: () => navigate(`/ipd/wards/${record.id}`, { state: { wardName: record.name } }),
        },
      ]}
    />
  );
}
