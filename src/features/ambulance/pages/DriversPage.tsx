import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { Driver } from '../types/ambulance.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  contact: z.string().min(1, 'Contact is required').max(30),
  cnic: z.string().min(1, 'CNIC is required').max(20),
  license_no: z.string().min(1, 'License number is required').max(50),
  address: z.string().min(1, 'Address is required').max(255),
});
type FormValues = z.infer<typeof schema>;

export const driversApi = createCrudApi<Driver, FormValues>('/ambulance/drivers', 'ambulance.fleet');
const hooks = createCrudHooks('ambulance.drivers', driversApi);
export const useDrivers = hooks.useList;

const columns: ColumnsType<Driver> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Contact', dataIndex: 'contact', width: 140 },
  { title: 'CNIC', dataIndex: 'cnic', width: 160 },
  { title: 'License No.', dataIndex: 'license_no', width: 140 },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'text', name: 'contact', label: 'Contact', required: true },
  { type: 'text', name: 'cnic', label: 'CNIC', required: true, placeholder: '12345-1234567-1' },
  { type: 'text', name: 'license_no', label: 'License Number', required: true },
  { type: 'textarea', name: 'address', label: 'Address', required: true },
];

export function DriversPage() {
  return (
    <CrudResourcePage<Driver, FormValues>
      title="Ambulance Drivers"
      singularTitle="Driver"
      screenKey="ambulance.fleet"
      breadcrumbs={[{ label: 'Ambulance' }, { label: 'Drivers' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      searchPlaceholder="Search drivers…"
      defaultValues={{ name: '', contact: '', cnic: '', license_no: '', address: '' }}
      toFormValues={(r) => ({ name: r.name, contact: r.contact, cnic: r.cnic, license_no: r.license_no, address: r.address })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
