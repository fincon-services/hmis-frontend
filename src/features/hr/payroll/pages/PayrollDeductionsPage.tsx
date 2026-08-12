import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface PayrollDeduction {
  id: number;
  name: string;
  calculation_type: string;
  percentage: number | null;
  fixed_amount: number | null;
  is_active: boolean;
}

const schema = z.object({
  name: z.string().min(1, 'Required').max(150),
  calculation_type: z.string().min(1, 'Required'),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const deductionsApi = createCrudApi<PayrollDeduction, FormValues>('/payroll/deductions', 'payroll.deductions');
const hooks = createCrudHooks('payroll.deductions', deductionsApi);

const columns: ColumnsType<PayrollDeduction> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Type', dataIndex: 'calculation_type', width: 130 },
  { title: 'Percentage', dataIndex: 'percentage', width: 110, render: (v: number | null) => (v != null ? `${v}%` : '—') },
  { title: 'Fixed Amount', dataIndex: 'fixed_amount', width: 130, render: (v: number | null) => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 110,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Provident Fund' },
  {
    type: 'select',
    name: 'calculation_type',
    label: 'Calculation Type',
    required: true,
    options: [
      { label: 'Percentage', value: 'percentage' },
      { label: 'Fixed', value: 'fixed' },
    ],
  },
  { type: 'number', name: 'percentage', label: 'Percentage', min: 0, max: 100 },
  { type: 'number', name: 'fixed_amount', label: 'Fixed Amount', min: 0 },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function PayrollDeductionsPage() {
  return (
    <CrudResourcePage<PayrollDeduction, FormValues>
      title="Payroll Deductions"
      singularTitle="Deduction"
      screenKey="payroll.deductions"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Deductions' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', calculation_type: 'percentage', percentage: undefined, fixed_amount: undefined, is_active: true }}
      toFormValues={(r) => ({ name: r.name, calculation_type: r.calculation_type, percentage: r.percentage ?? undefined, fixed_amount: r.fixed_amount ?? undefined, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
