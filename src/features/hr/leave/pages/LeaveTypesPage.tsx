import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface LeaveType {
  id: number;
  name: string;
  is_active: boolean;
}

const schema = z.object({ name: z.string().min(1, 'Name is required').max(150), is_active: z.boolean() });
type FormValues = z.infer<typeof schema>;

export const leaveTypesApi = createCrudApi<LeaveType, FormValues>('/leave/types', 'leave.types');
const hooks = createCrudHooks('leave.types', leaveTypesApi);
export const useLeaveTypes = hooks.useList;

const columns: ColumnsType<LeaveType> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Annual Leave' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function LeaveTypesPage() {
  return (
    <CrudResourcePage<LeaveType, FormValues>
      title="Leave Types"
      singularTitle="Leave Type"
      screenKey="leave.types"
      breadcrumbs={[{ label: 'HR' }, { label: 'Leave' }, { label: 'Types' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', is_active: true }}
      toFormValues={(r) => ({ name: r.name, is_active: r.is_active })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
    />
  );
}
