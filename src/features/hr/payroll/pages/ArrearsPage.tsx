import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface EmployeeSalaryArrear {
  id: number;
  employee_id: number;
  amount: number;
  employment_status_id: number;
  is_consumed: boolean;
  consumed_at: string | null;
}

const schema = z.object({
  employee_id: z.number({ required_error: 'Required' }),
  amount: z.number({ required_error: 'Required' }).min(0),
});
type FormValues = z.infer<typeof schema>;

const arrearsApi = createCrudApi<EmployeeSalaryArrear, FormValues>('/payroll/arrears', 'payroll.arrears');
const hooks = createCrudHooks('payroll.arrears', arrearsApi);

const columns: ColumnsType<EmployeeSalaryArrear> = [
  { title: 'Employee ID', dataIndex: 'employee_id', width: 120 },
  { title: 'Amount', dataIndex: 'amount', width: 130 },
  { title: 'Status', dataIndex: 'is_consumed', width: 130, render: (v: boolean) => <StatusBadge label={v ? 'Consumed' : 'Pending'} tone={v ? 'default' : 'warning'} /> },
  { title: 'Consumed At', dataIndex: 'consumed_at', render: (v: string | null) => v ?? '—' },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'employee_id', label: 'Employee ID', required: true, min: 1 },
  { type: 'number', name: 'amount', label: 'Amount', required: true, min: 0 },
];

export function ArrearsPage() {
  return (
    <CrudResourcePage<EmployeeSalaryArrear, FormValues>
      title="Salary Arrears"
      singularTitle="Arrear"
      screenKey="payroll.arrears"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Arrears' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ employee_id: undefined as unknown as number, amount: 0 }}
      toFormValues={() => ({ employee_id: undefined as unknown as number, amount: 0 })}
      recordLabel={(r) => `Employee #${r.employee_id} — ${r.amount}`}
      hooks={hooks}
      enableBulkDelete={false}
      enableEdit={false}
    />
  );
}
