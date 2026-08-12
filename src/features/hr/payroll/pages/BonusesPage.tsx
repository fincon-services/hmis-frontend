import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface EmployeeBonus {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  amount: number;
  reason: string | null;
}

const schema = z.object({
  employee_id: z.number({ required_error: 'Required' }),
  month: z.number({ required_error: 'Required' }).min(1).max(12),
  year: z.number({ required_error: 'Required' }).min(2000),
  amount: z.number({ required_error: 'Required' }).min(0),
  reason: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const bonusesApi = createCrudApi<EmployeeBonus, FormValues>('/payroll/bonuses', 'payroll.bonuses');
const hooks = createCrudHooks('payroll.bonuses', bonusesApi);

const columns: ColumnsType<EmployeeBonus> = [
  { title: 'Employee ID', dataIndex: 'employee_id', width: 120 },
  { title: 'Month', dataIndex: 'month', width: 90 },
  { title: 'Year', dataIndex: 'year', width: 90 },
  { title: 'Amount', dataIndex: 'amount', width: 120 },
  { title: 'Reason', dataIndex: 'reason', render: (v: string | null) => v ?? '—' },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'employee_id', label: 'Employee ID', required: true, min: 1 },
  { type: 'number', name: 'month', label: 'Month', required: true, min: 1, max: 12 },
  { type: 'number', name: 'year', label: 'Year', required: true, min: 2000 },
  { type: 'number', name: 'amount', label: 'Amount', required: true, min: 0 },
  { type: 'textarea', name: 'reason', label: 'Reason' },
];

export function BonusesPage() {
  return (
    <CrudResourcePage<EmployeeBonus, FormValues>
      title="Employee Bonuses"
      singularTitle="Bonus"
      screenKey="payroll.bonuses"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Bonuses' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ employee_id: undefined as unknown as number, month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0, reason: '' }}
      toFormValues={() => ({ employee_id: undefined as unknown as number, month: 1, year: new Date().getFullYear(), amount: 0, reason: '' })}
      recordLabel={(r) => `Employee #${r.employee_id} — ${r.month}/${r.year}`}
      hooks={hooks}
      enableBulkDelete={false}
      enableEdit={false}
    />
  );
}
