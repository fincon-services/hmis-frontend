import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface WarehouseLocation {
  id: number;
  name: string;
  parent_id: number | null;
}

const schema = z.object({ name: z.string().min(1, 'Required').max(150), parent_id: z.number().optional() });
type FormValues = z.infer<typeof schema>;

export const locationsApi = createCrudApi<WarehouseLocation, FormValues>('/warehouse/locations', 'warehouse.catalog');
const hooks = createCrudHooks('warehouse.locations', locationsApi);
export const useLocations = hooks.useList;

const columns: ColumnsType<WarehouseLocation> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Parent Location ID', dataIndex: 'parent_id', render: (v: number | null) => v ?? '—' },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Main Store' },
  { type: 'number', name: 'parent_id', label: 'Parent Location ID', min: 1, helpText: 'Leave blank for a top-level location' },
];

export function LocationsPage() {
  return (
    <CrudResourcePage<WarehouseLocation, FormValues>
      title="Storage Locations"
      singularTitle="Location"
      screenKey="warehouse.catalog"
      breadcrumbs={[{ label: 'Warehouse' }, { label: 'Locations' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', parent_id: undefined }}
      toFormValues={(r) => ({ name: r.name, parent_id: r.parent_id ?? undefined })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
