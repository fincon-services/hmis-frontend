import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface TaxSlab {
  id: number;
  salary_from: number;
  salary_to: number;
  tax_rate: number;
  fixed_amount: number;
  is_active: boolean;
}

const schema = z.object({
  salary_from: z.number({ required_error: 'Required' }).min(0),
  salary_to: z.number({ required_error: 'Required' }).min(0),
  tax_rate: z.number({ required_error: 'Required' }).min(0).max(100),
  fixed_amount: z.number().min(0).optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const taxSlabsApi = createCrudApi<TaxSlab, FormValues>('/payroll/tax-slabs', 'payroll.tax-slabs');
const hooks = createCrudHooks('payroll.tax-slabs', taxSlabsApi);

const columns: ColumnsType<TaxSlab> = [
  { title: 'Salary From', dataIndex: 'salary_from', width: 130 },
  { title: 'Salary To', dataIndex: 'salary_to', width: 130 },
  { title: 'Tax Rate %', dataIndex: 'tax_rate', width: 110 },
  { title: 'Fixed Amount', dataIndex: 'fixed_amount', width: 130 },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 110,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'salary_from', label: 'Salary From', required: true, min: 0 },
  { type: 'number', name: 'salary_to', label: 'Salary To', required: true, min: 0 },
  { type: 'number', name: 'tax_rate', label: 'Tax Rate (%)', required: true, min: 0, max: 100 },
  { type: 'number', name: 'fixed_amount', label: 'Fixed Amount', min: 0 },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function TaxSlabsPage() {
  return (
    <CrudResourcePage<TaxSlab, FormValues>
      title="Tax Slabs"
      singularTitle="Tax Slab"
      screenKey="payroll.tax-slabs"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Tax Slabs' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ salary_from: 0, salary_to: 0, tax_rate: 0, fixed_amount: 0, is_active: true }}
      toFormValues={(r) => ({ salary_from: r.salary_from, salary_to: r.salary_to, tax_rate: r.tax_rate, fixed_amount: r.fixed_amount, is_active: r.is_active })}
      recordLabel={(r) => `${r.salary_from}-${r.salary_to}`}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
