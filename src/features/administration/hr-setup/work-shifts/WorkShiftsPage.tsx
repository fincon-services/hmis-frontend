import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface WorkShift {
  id: number;
  name: string;
  short_code: string;
  start_time: string;
  end_time: string;
  crosses_midnight: boolean;
  hours_per_day: number;
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  short_code: z.string().min(1, 'Short code is required').max(20),
  start_time: z.string().regex(timePattern, 'Enter a valid time'),
  end_time: z.string().regex(timePattern, 'Enter a valid time'),
  crosses_midnight: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const workShiftsApi = createCrudApi<WorkShift, FormValues>('/admin/work-shifts', 'admin.work-shifts');
const hooks = createCrudHooks('admin.work-shifts', workShiftsApi);
export const useWorkShifts = hooks.useList;

const columns: ColumnsType<WorkShift> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Short Code', dataIndex: 'short_code', width: 110 },
  { title: 'Start', dataIndex: 'start_time', width: 90 },
  { title: 'End', dataIndex: 'end_time', width: 90 },
  { title: 'Crosses Midnight', dataIndex: 'crosses_midnight', width: 140, render: (v: boolean) => (v ? 'Yes' : 'No') },
  { title: 'Hours/Day', dataIndex: 'hours_per_day', width: 110 },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Night Shift' },
  { type: 'text', name: 'short_code', label: 'Short Code', required: true, placeholder: 'NGT' },
  { type: 'time', name: 'start_time', label: 'Start Time', required: true },
  { type: 'time', name: 'end_time', label: 'End Time', required: true },
  { type: 'switch', name: 'crosses_midnight', label: 'Crosses midnight' },
];

export function WorkShiftsPage() {
  return (
    <CrudResourcePage<WorkShift, FormValues>
      title="Work Shifts"
      singularTitle="Work Shift"
      screenKey="admin.work-shifts"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Work Shifts' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', short_code: '', start_time: '', end_time: '', crosses_midnight: false }}
      toFormValues={(r) => ({
        name: r.name,
        short_code: r.short_code,
        start_time: r.start_time,
        end_time: r.end_time,
        crosses_midnight: r.crosses_midnight,
      })}
      recordLabel={(r) => r.name}
      hooks={hooks}
    />
  );
}
