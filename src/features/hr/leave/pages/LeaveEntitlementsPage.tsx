import { useMemo } from 'react';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { useLeaveTypes } from './LeaveTypesPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface YearlyLeaveEntitlement {
  id: number;
  leave_type_id: number;
  leave_type_name: string | null;
  year: number;
  entitled_days: number;
}

const schema = z.object({
  leave_type_id: z.number({ required_error: 'Required' }),
  year: z.number({ required_error: 'Required' }).min(2000),
  entitled_days: z.number({ required_error: 'Required' }).min(0),
});
type FormValues = z.infer<typeof schema>;

const entitlementsApi = createCrudApi<YearlyLeaveEntitlement, FormValues>('/leave/entitlements', 'leave.entitlements');
const hooks = createCrudHooks('leave.entitlements', entitlementsApi);

const columns: ColumnsType<YearlyLeaveEntitlement> = [
  { title: 'Leave Type', dataIndex: 'leave_type_name' },
  { title: 'Year', dataIndex: 'year', width: 100 },
  { title: 'Entitled Days', dataIndex: 'entitled_days', width: 130 },
];

export function LeaveEntitlementsPage() {
  const leaveTypesQuery = useLeaveTypes({ per_page: 0 });
  const leaveTypeOptions = useMemo(() => (leaveTypesQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [leaveTypesQuery.data]);

  const fields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'leave_type_id', label: 'Leave Type', required: true, options: leaveTypeOptions },
    { type: 'number', name: 'year', label: 'Year', required: true, min: 2000 },
    { type: 'number', name: 'entitled_days', label: 'Entitled Days', required: true, min: 0 },
  ];

  return (
    <CrudResourcePage<YearlyLeaveEntitlement, FormValues>
      title="Yearly Leave Entitlements"
      singularTitle="Entitlement"
      screenKey="leave.entitlements"
      breadcrumbs={[{ label: 'HR' }, { label: 'Leave' }, { label: 'Entitlements' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ leave_type_id: undefined as unknown as number, year: new Date().getFullYear(), entitled_days: 0 }}
      toFormValues={(r) => ({ leave_type_id: r.leave_type_id, year: r.year, entitled_days: r.entitled_days })}
      recordLabel={(r) => `${r.leave_type_name} ${r.year}`}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
