import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { FlaskConical } from 'lucide-react';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import { useLabTestCategories } from './LabTestCategoriesPage';
import type { LabTest } from '../types/laboratory.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  lab_test_category_id: z.number({ required_error: 'Category is required', invalid_type_error: 'Category is required' }),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const labTestsApi = createCrudApi<LabTest, FormValues>('/laboratory/tests', 'laboratory.catalog');
const hooks = createCrudHooks('laboratory.tests', labTestsApi);
export const useLabTests = hooks.useList;

const columns: ColumnsType<LabTest> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Category', dataIndex: 'category_name', render: (v: string | null) => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

export function LabTestsPage() {
  const navigate = useNavigate();
  const categoriesQuery = useLabTestCategories({ per_page: 0 });
  const categoryOptions = useMemo(
    () => (categoriesQuery.data?.data ?? []).map((c) => ({ label: c.name, value: c.id })),
    [categoriesQuery.data],
  );

  const fields: FieldConfig<FormValues>[] = [
    { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Complete Blood Count' },
    { type: 'select', name: 'lab_test_category_id', label: 'Category', required: true, options: categoryOptions },
    { type: 'switch', name: 'is_active', label: 'Active' },
  ];

  return (
    <CrudResourcePage<LabTest, FormValues>
      title="Lab Tests"
      singularTitle="Lab Test"
      screenKey="laboratory.catalog"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'Laboratory' }, { label: 'Tests' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', lab_test_category_id: undefined as unknown as number, is_active: true }}
      toFormValues={(r) => ({ name: r.name, lab_test_category_id: r.lab_test_category_id, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
      extraRowActions={(record) => [
        {
          key: 'parameters',
          label: 'Manage Parameters',
          icon: <FlaskConical size={14} />,
          onClick: () => navigate(`/laboratory/tests/${record.id}/parameters`, { state: { testName: record.name } }),
        },
      ]}
    />
  );
}
