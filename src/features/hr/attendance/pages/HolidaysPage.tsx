import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface Holiday {
  id: number;
  description: string;
  date: string;
  is_recurring: boolean;
}

const schema = z.object({
  description: z.string().min(1, 'Required').max(150),
  date: z.string().min(1, 'Required'),
  is_recurring: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const holidaysApi = createCrudApi<Holiday, FormValues>('/attendance/holidays', 'attendance.holidays');
const hooks = createCrudHooks('attendance.holidays', holidaysApi);

const columns: ColumnsType<Holiday> = [
  { title: 'Description', dataIndex: 'description' },
  { title: 'Date', dataIndex: 'date', width: 140 },
  { title: 'Recurring', dataIndex: 'is_recurring', width: 110, render: (v: boolean) => (v ? 'Yes' : 'No') },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'description', label: 'Description', required: true, placeholder: 'Independence Day' },
  { type: 'text', name: 'date', label: 'Date (YYYY-MM-DD)', required: true },
  { type: 'switch', name: 'is_recurring', label: 'Recurs Every Year' },
];

export function HolidaysPage() {
  return (
    <CrudResourcePage<Holiday, FormValues>
      title="Holidays"
      singularTitle="Holiday"
      screenKey="attendance.holidays"
      breadcrumbs={[{ label: 'HR' }, { label: 'Attendance' }, { label: 'Holidays' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ description: '', date: '', is_recurring: false }}
      toFormValues={(r) => ({ description: r.description, date: r.date, is_recurring: r.is_recurring })}
      recordLabel={(r) => r.description}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
