import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface JobTitle {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const jobTitlesApi = createCrudApi<JobTitle, FormValues>('/admin/job-titles', 'admin.job-titles');
const hooks = createCrudHooks('admin.job-titles', jobTitlesApi);
export const useJobTitles = hooks.useList;

const columns: ColumnsType<JobTitle> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Description', dataIndex: 'description', ellipsis: true },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Staff Nurse' },
  { type: 'textarea', name: 'description', label: 'Description', placeholder: 'Ward-level nursing staff' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function JobTitlesPage() {
  return (
    <CrudResourcePage<JobTitle, FormValues>
      title="Job Titles"
      singularTitle="Job Title"
      screenKey="admin.job-titles"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Job Titles' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', description: '', is_active: true }}
      toFormValues={(r) => ({ name: r.name, description: r.description ?? '', is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
    />
  );
}
