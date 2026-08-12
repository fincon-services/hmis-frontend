import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { LabTestCategory } from '../types/laboratory.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({ name: z.string().min(1, 'Name is required').max(150), is_active: z.boolean() });
type FormValues = z.infer<typeof schema>;

export const labTestCategoriesApi = createCrudApi<LabTestCategory, FormValues>('/laboratory/test-categories', 'laboratory.catalog');
const hooks = createCrudHooks('laboratory.test-categories', labTestCategoriesApi);
export const useLabTestCategories = hooks.useList;

const columns: ColumnsType<LabTestCategory> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Hematology' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function LabTestCategoriesPage() {
  return (
    <CrudResourcePage<LabTestCategory, FormValues>
      title="Lab Test Categories"
      singularTitle="Lab Test Category"
      screenKey="laboratory.catalog"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Laboratory' }, { label: 'Test Categories' }]}
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
