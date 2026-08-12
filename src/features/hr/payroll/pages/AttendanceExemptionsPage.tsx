import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface EmployeeAttendanceExemption {
  id: number;
  employee_id: number;
  exemption_type: string;
  value: number | null;
  is_active: boolean;
  notes: string | null;
}

const schema = z.object({
  employee_id: z.number({ required_error: 'Required' }),
  exemption_type: z.string().min(1, 'Required'),
  value: z.number().optional(),
  is_active: z.boolean(),
  notes: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const exemptionsApi = createCrudApi<EmployeeAttendanceExemption, FormValues>('/payroll/attendance-exemptions', 'payroll.attendance-exemptions');
const hooks = createCrudHooks('payroll.attendance-exemptions', exemptionsApi);

const columns: ColumnsType<EmployeeAttendanceExemption> = [
  { title: 'Employee ID', dataIndex: 'employee_id', width: 120 },
  { title: 'Type', dataIndex: 'exemption_type' },
  { title: 'Value', dataIndex: 'value', render: (v: number | null) => v ?? '—' },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 110,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'number', name: 'employee_id', label: 'Employee ID', required: true, min: 1 },
  { type: 'text', name: 'exemption_type', label: 'Exemption Type', required: true, placeholder: 'e.g. late_grace' },
  { type: 'number', name: 'value', label: 'Value' },
  { type: 'switch', name: 'is_active', label: 'Active' },
  { type: 'textarea', name: 'notes', label: 'Notes' },
];

export function AttendanceExemptionsPage() {
  return (
    <CrudResourcePage<EmployeeAttendanceExemption, FormValues>
      title="Attendance Exemptions"
      singularTitle="Exemption"
      screenKey="payroll.attendance-exemptions"
      breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Attendance Exemptions' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ employee_id: undefined as unknown as number, exemption_type: '', is_active: true, notes: '' }}
      toFormValues={(r) => ({ employee_id: r.employee_id, exemption_type: r.exemption_type, value: r.value ?? undefined, is_active: r.is_active, notes: r.notes ?? '' })}
      recordLabel={(r) => `Employee #${r.employee_id} — ${r.exemption_type}`}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
