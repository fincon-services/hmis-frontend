import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface JobCategory {
  id: number;
  name: string;
  tracks_late_early: boolean;
  is_active: boolean;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  tracks_late_early: z.boolean(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const jobCategoriesApi = createCrudApi<JobCategory, FormValues>('/admin/job-categories', 'admin.job-categories');
const hooks = createCrudHooks('admin.job-categories', jobCategoriesApi);
export const useJobCategories = hooks.useList;

const columns: ColumnsType<JobCategory> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  {
    title: 'Tracks Late/Early',
    dataIndex: 'tracks_late_early',
    width: 160,
    render: (v: boolean) => (v ? 'Yes' : 'No'),
  },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Nursing' },
  { type: 'switch', name: 'tracks_late_early', label: 'Track late / early departure on attendance' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function JobCategoriesPage() {
  return (
    <CrudResourcePage<JobCategory, FormValues>
      title="Job Categories"
      singularTitle="Job Category"
      screenKey="admin.job-categories"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Job Categories' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', tracks_late_early: false, is_active: true }}
      toFormValues={(r) => ({ name: r.name, tracks_late_early: r.tracks_late_early, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
    />
  );
}
