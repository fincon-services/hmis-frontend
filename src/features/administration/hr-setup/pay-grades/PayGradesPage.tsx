import { useMemo } from 'react';
import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import { useCurrencies } from '../currencies/CurrenciesPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface PayGrade {
  id: number;
  name: string;
  currency: { id: number; code: string; name: string } | [];
  min_salary: number;
  max_salary: number;
  is_active: boolean;
}

const schema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150),
    currency_id: z.number({ required_error: 'Currency is required', invalid_type_error: 'Currency is required' }),
    min_salary: z.number({ required_error: 'Minimum salary is required', invalid_type_error: 'Minimum salary is required' }).min(0),
    max_salary: z.number({ required_error: 'Maximum salary is required', invalid_type_error: 'Maximum salary is required' }).min(0),
    is_active: z.boolean(),
  })
  .refine((data) => data.max_salary >= data.min_salary, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['max_salary'],
  });
type FormValues = z.infer<typeof schema>;

const payGradesApi = createCrudApi<PayGrade, FormValues>('/admin/pay-grades', 'admin.pay-grades');
const hooks = createCrudHooks('admin.pay-grades', payGradesApi);
export const usePayGrades = hooks.useList;

const columns: ColumnsType<PayGrade> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  {
    title: 'Currency',
    key: 'currency',
    width: 120,
    render: (_, r) => (Array.isArray(r.currency) ? '—' : r.currency.code),
  },
  { title: 'Min Salary', dataIndex: 'min_salary', width: 130, render: (v: number) => v.toLocaleString() },
  { title: 'Max Salary', dataIndex: 'max_salary', width: 130, render: (v: number) => v.toLocaleString() },
  {
    title: 'Status',
    dataIndex: 'is_active',
    width: 120,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

export function PayGradesPage() {
  const currenciesQuery = useCurrencies({ per_page: 0 });
  const currencyOptions = useMemo(
    () => (currenciesQuery.data?.data ?? []).map((c) => ({ label: `${c.code} — ${c.name}`, value: c.id })),
    [currenciesQuery.data],
  );

  const fields: FieldConfig<FormValues>[] = [
    { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'Grade A' },
    { type: 'select', name: 'currency_id', label: 'Currency', required: true, options: currencyOptions },
    { type: 'number', name: 'min_salary', label: 'Minimum Salary', required: true, min: 0 },
    { type: 'number', name: 'max_salary', label: 'Maximum Salary', required: true, min: 0 },
    { type: 'switch', name: 'is_active', label: 'Active' },
  ];

  return (
    <CrudResourcePage<PayGrade, FormValues>
      title="Pay Grades"
      singularTitle="Pay Grade"
      screenKey="admin.pay-grades"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Pay Grades' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', currency_id: undefined as unknown as number, min_salary: 0, max_salary: 0, is_active: true }}
      toFormValues={(r) => ({
        name: r.name,
        currency_id: Array.isArray(r.currency) ? (undefined as unknown as number) : r.currency.id,
        min_salary: r.min_salary,
        max_salary: r.max_salary,
        is_active: r.is_active,
      })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      hasIsActiveFilter
    />
  );
}
