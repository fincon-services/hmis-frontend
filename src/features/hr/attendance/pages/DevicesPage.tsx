import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface AttendanceDevice {
  id: number;
  ip_address: string;
  is_active: boolean;
}

const schema = z.object({
  ip_address: z.string().min(1, 'Required').max(50),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const devicesApi = createCrudApi<AttendanceDevice, FormValues>('/attendance/devices', 'attendance.devices');
const hooks = createCrudHooks('attendance.devices', devicesApi);

const columns: ColumnsType<AttendanceDevice> = [
  { title: 'IP Address', dataIndex: 'ip_address' },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'ip_address', label: 'IP Address', required: true, placeholder: '192.168.1.10' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function DevicesPage() {
  return (
    <CrudResourcePage<AttendanceDevice, FormValues>
      title="Biometric Devices"
      singularTitle="Device"
      screenKey="attendance.devices"
      breadcrumbs={[{ label: 'HR' }, { label: 'Attendance' }, { label: 'Devices' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ ip_address: '', is_active: true }}
      toFormValues={(r) => ({ ip_address: r.ip_address, is_active: r.is_active })}
      recordLabel={(r) => r.ip_address}
      hooks={hooks}
      hasIsActiveFilter
      enableBulkDelete={false}
    />
  );
}
