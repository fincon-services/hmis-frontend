import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface Currency {
  id: number;
  code: string;
  name: string;
}

const schema = z.object({
  code: z.string().length(3, 'Code must be exactly 3 letters (ISO 4217)').toUpperCase(),
  name: z.string().min(1, 'Name is required').max(70),
});
type FormValues = z.infer<typeof schema>;

export const currenciesApi = createCrudApi<Currency, FormValues>('/admin/currencies', 'admin.currencies');
const hooks = createCrudHooks('admin.currencies', currenciesApi);
export const useCurrencies = hooks.useList;

const columns: ColumnsType<Currency> = [
  { title: 'Code', dataIndex: 'code', width: 100, sorter: true },
  { title: 'Name', dataIndex: 'name', sorter: true },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'code', label: 'ISO Code', required: true, placeholder: 'PKR', helpText: '3-letter ISO 4217 code' },
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Pakistani Rupee' },
];

export function CurrenciesPage() {
  return (
    <CrudResourcePage<Currency, FormValues>
      title="Currencies"
      singularTitle="Currency"
      screenKey="admin.currencies"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Currencies' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', name: '' } as FormValues}
      toFormValues={(r) => ({ code: r.code, name: r.name })}
      recordLabel={(r) => r.name}
      hooks={hooks}
    />
  );
}
