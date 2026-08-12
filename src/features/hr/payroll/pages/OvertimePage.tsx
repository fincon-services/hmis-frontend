import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle } from 'lucide-react';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { queryClient } from '@/api/queryClient';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface EmployeeOvertime {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  hours: number;
  hourly_rate: number;
  amount: number;
  is_approved: boolean;
  notes: string | null;
}

const schema = z.object({
  employee_id: z.number({ required_error: 'Required' }),
  month: z.number({ required_error: 'Required' }).min(1).max(12),
  year: z.number({ required_error: 'Required' }).min(2000),
  hours: z.number({ required_error: 'Required' }).min(0),
  hourly_rate: z.number({ required_error: 'Required' }).min(0),
  notes: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const overtimeApi = createCrudApi<EmployeeOvertime, FormValues>('/payroll/overtime', 'payroll.overtime');
const hooks = createCrudHooks('payroll.overtime', overtimeApi);

const columns: ColumnsType<EmployeeOvertime> = [
  { title: 'Employee ID', dataIndex: 'employee_id', width: 110 },
  { title: 'Month/Year', key: 'my', width: 110, render: (_, r) => `${r.month}/${r.year}` },
  { title: 'Hours', dataIndex: 'hours', width: 90 },
  { title: 'Rate', dataIndex: 'hourly_rate', width: 90 },
  { title: 'Amount', dataIndex: 'amount', width: 100 },
  { title: 'Approved', dataIndex: 'is_approved', width: 110, render: (v: boolean) => <StatusBadge label={v ? 'Approved' : 'Pending'} tone={v ? 'success' : 'warning'} /> },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'employee_id', label: 'Employee ID', required: true, min: 1 },
  { type: 'number', name: 'month', label: 'Month', required: true, min: 1, max: 12 },
  { type: 'number', name: 'year', label: 'Year', required: true, min: 2000 },
  { type: 'number', name: 'hours', label: 'Hours', required: true, min: 0 },
  { type: 'number', name: 'hourly_rate', label: 'Hourly Rate', required: true, min: 0 },
  { type: 'textarea', name: 'notes', label: 'Notes' },
];

export function OvertimePage() {
  const { message } = useFeedback();

  const onApprove = (id: number) => {
    apiClient
      .post(`/payroll/overtime/${id}/approve`, undefined, { screenKey: 'payroll.overtime' })
      .then(() => {
        message.success('Overtime approved.');
        queryClient.invalidateQueries({ queryKey: ['payroll.overtime'] });
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to approve overtime.')));
  };

  return (
    <CrudResourcePage<EmployeeOvertime, FormValues>
      title="Employee Overtime"
      singularTitle="Overtime Record"
      screenKey="payroll.overtime"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Overtime' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ employee_id: undefined as unknown as number, month: new Date().getMonth() + 1, year: new Date().getFullYear(), hours: 0, hourly_rate: 0, notes: '' }}
      toFormValues={() => ({ employee_id: undefined as unknown as number, month: 1, year: new Date().getFullYear(), hours: 0, hourly_rate: 0, notes: '' })}
      recordLabel={(r) => `Employee #${r.employee_id} — ${r.month}/${r.year}`}
      hooks={hooks}
      enableBulkDelete={false}
      enableEdit={false}
      extraRowActions={(record) =>
        record.is_approved
          ? []
          : [{ key: 'approve', label: 'Approve', icon: <CheckCircle size={14} />, onClick: () => onApprove(record.id) }]
      }
    />
  );
}
