import { useMemo } from 'react';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { Download } from 'lucide-react';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { useLeaveTypes } from './LeaveTypesPage';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface EmployeeLeave {
  id: number;
  employee_id: number;
  employee_name: string | null;
  leave_type_id: number;
  leave_type_name: string | null;
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  no_of_days: number;
  is_unpaid: boolean;
  application_copy_url: string | null;
}

const schema = z.object({
  employee_id: z.number({ required_error: 'Required' }),
  leave_type_id: z.number({ required_error: 'Required' }),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  is_half_day: z.boolean(),
  no_of_days: z.number({ required_error: 'Required' }).min(0),
  is_unpaid: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const employeeLeavesApi = createCrudApi<EmployeeLeave, FormValues>('/leave/employee-leaves', 'leave.employee-leaves');
const hooks = createCrudHooks('leave.employee-leaves', employeeLeavesApi);

const columns: ColumnsType<EmployeeLeave> = [
  { title: 'Employee', key: 'employee', render: (_, r) => r.employee_name ?? `#${r.employee_id}` },
  { title: 'Leave Type', dataIndex: 'leave_type_name' },
  { title: 'Start', dataIndex: 'start_date', width: 120 },
  { title: 'End', dataIndex: 'end_date', width: 120 },
  { title: 'Days', dataIndex: 'no_of_days', width: 80 },
  { title: 'Unpaid', dataIndex: 'is_unpaid', width: 90, render: (v: boolean) => (v ? 'Yes' : 'No') },
];

async function downloadApplicationCopy(record: EmployeeLeave) {
  const response = await apiClient.get<Blob>(`/leave/employee-leaves/${record.id}/download`, {
    screenKey: 'leave.employee-leaves',
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leave-application-${record.id}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EmployeeLeavesPage() {
  const leaveTypesQuery = useLeaveTypes({ per_page: 0 });
  const leaveTypeOptions = useMemo(() => (leaveTypesQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [leaveTypesQuery.data]);
  const { message } = useFeedback();

  const fields: FieldConfig<FormValues>[] = [
    { type: 'number', name: 'employee_id', label: 'Employee ID', required: true, min: 1 },
    { type: 'select', name: 'leave_type_id', label: 'Leave Type', required: true, options: leaveTypeOptions },
    { type: 'text', name: 'start_date', label: 'Start Date (YYYY-MM-DD)', required: true },
    { type: 'text', name: 'end_date', label: 'End Date (YYYY-MM-DD)', required: true },
    { type: 'number', name: 'no_of_days', label: 'Number of Days', required: true, min: 0 },
    { type: 'switch', name: 'is_half_day', label: 'Half Day' },
    { type: 'switch', name: 'is_unpaid', label: 'Unpaid' },
  ];

  return (
    <CrudResourcePage<EmployeeLeave, FormValues>
      title="Employee Leaves"
      singularTitle="Leave Record"
      screenKey="leave.employee-leaves"
      breadcrumbs={[{ label: 'HR' }, { label: 'Leave' }, { label: 'Employee Leaves' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ employee_id: undefined as unknown as number, leave_type_id: undefined as unknown as number, start_date: '', end_date: '', is_half_day: false, no_of_days: 1, is_unpaid: false }}
      toFormValues={(r) => ({ employee_id: r.employee_id, leave_type_id: r.leave_type_id, start_date: r.start_date, end_date: r.end_date, is_half_day: r.is_half_day, no_of_days: r.no_of_days, is_unpaid: r.is_unpaid })}
      recordLabel={(r) => `${r.employee_name ?? `#${r.employee_id}`} — ${r.start_date}`}
      hooks={hooks}
      extraRowActions={(record) =>
        record.application_copy_url
          ? [
              {
                key: 'download',
                label: 'Download Application',
                icon: <Download size={14} />,
                onClick: () => downloadApplicationCopy(record).catch((error) => message.error(getErrorMessage(error, 'Unable to download application copy.'))),
              },
            ]
          : []
      }
    />
  );
}
