import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { Vehicle } from '../types/ambulance.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  registration_number: z.string().min(1, 'Registration number is required').max(50),
  opening_reading: z.number().min(0).optional(),
});
type FormValues = z.infer<typeof schema>;

export const vehiclesApi = createCrudApi<Vehicle, FormValues>('/ambulance/vehicles', 'ambulance.fleet');
const hooks = createCrudHooks('ambulance.vehicles', vehiclesApi);
export const useVehicles = hooks.useList;

const columns: ColumnsType<Vehicle> = [
  { title: 'Registration Number', dataIndex: 'registration_number' },
  { title: 'Opening Reading', dataIndex: 'opening_reading', width: 150 },
  { title: 'Current Reading', dataIndex: 'current_reading', width: 150 },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'registration_number', label: 'Registration Number', required: true, placeholder: 'EA-1153' },
  { type: 'number', name: 'opening_reading', label: 'Opening Reading', min: 0 },
];

export function VehiclesPage() {
  return (
    <CrudResourcePage<Vehicle, FormValues>
      title="Ambulance Vehicles"
      singularTitle="Vehicle"
      screenKey="ambulance.fleet"
      breadcrumbs={[{ label: 'Ambulance' }, { label: 'Vehicles' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ registration_number: '', opening_reading: 0 }}
      toFormValues={(r) => ({ registration_number: r.registration_number, opening_reading: r.opening_reading })}
      recordLabel={(r) => r.registration_number}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
