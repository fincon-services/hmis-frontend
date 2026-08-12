import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface PayrollAllowance {
  id: number;
  name: string;
  percentage: number | null;
  fixed_amount: number | null;
  is_active: boolean;
}

const schema = z.object({
  name: z.string().min(1, 'Required').max(150),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const allowancesApi = createCrudApi<PayrollAllowance, FormValues>('/payroll/allowances', 'payroll.allowances');
const hooks = createCrudHooks('payroll.allowances', allowancesApi);

const columns: ColumnsType<PayrollAllowance> = [
  { title: 'Name', dataIndex: 'name' },
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
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'House Rent Allowance' },
  { type: 'number', name: 'percentage', label: 'Percentage', min: 0, max: 100 },
  { type: 'number', name: 'fixed_amount', label: 'Fixed Amount', min: 0 },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function PayrollAllowancesPage() {
  return (
    <CrudResourcePage<PayrollAllowance, FormValues>
      title="Payroll Allowances"
      singularTitle="Allowance"
      screenKey="payroll.allowances"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Allowances' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', percentage: undefined, fixed_amount: undefined, is_active: true }}
      toFormValues={(r) => ({ name: r.name, percentage: r.percentage ?? undefined, fixed_amount: r.fixed_amount ?? undefined, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
