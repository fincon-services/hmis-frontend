import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import { apiClient } from '@/api/client';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type { CollectionResponse } from '@/types/api';

const SCREEN = 'finance.setup';

export interface ChartAccount {
  id: number;
  name: string;
  code: string | null;
  parent_id: number | null;
  account_type: 'asset' | 'liability' | 'income' | 'expense';
  opening_balance: number | null;
}

const schema = z.object({
  name: z.string().min(1, 'Required').max(150),
  code: z.string().optional().or(z.literal('')),
  parent_id: z.number().optional(),
  account_type: z.enum(['asset', 'liability', 'income', 'expense'], { required_error: 'Required' }),
  opening_balance: z.number().optional(),
});
type FormValues = z.infer<typeof schema>;

export const chartAccountsApi = createCrudApi<ChartAccount, FormValues>('/finance/chart-accounts', SCREEN);
const hooks = createCrudHooks(SCREEN, chartAccountsApi);
export const useChartAccounts = hooks.useList;

export function useChartAccountsPlain(params: { per_page: number }) {
  return useQuery({
    queryKey: ['finance-chart-accounts-plain', params],
    queryFn: () => apiClient.get<CollectionResponse<ChartAccount>>('/finance/chart-accounts', { params, screenKey: SCREEN }).then((r) => r.data),
  });
}

const accountTypeOptions = [
  { label: 'Asset', value: 'asset' },
  { label: 'Liability', value: 'liability' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

const columns: ColumnsType<ChartAccount> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Code', dataIndex: 'code', width: 120, render: (v: string | null) => v ?? '—' },
  { title: 'Type', dataIndex: 'account_type', width: 120 },
  { title: 'Opening Balance', dataIndex: 'opening_balance', width: 150, render: (v: number | null) => v ?? '—' },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Account Name', required: true },
  { type: 'text', name: 'code', label: 'Code' },
  { type: 'select', name: 'account_type', label: 'Account Type', required: true, options: accountTypeOptions },
  { type: 'number', name: 'parent_id', label: 'Parent Account ID' },
  { type: 'number', name: 'opening_balance', label: 'Opening Balance' },
];

export function ChartAccountsPage() {
  return (
    <CrudResourcePage<ChartAccount, FormValues>
      title="Chart of Accounts"
      singularTitle="Account"
      screenKey={SCREEN}
      breadcrumbs={[{ label: 'Finance' }, { label: 'Chart of Accounts' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', code: '', account_type: undefined as unknown as FormValues['account_type'], parent_id: undefined, opening_balance: undefined }}
      toFormValues={(r) => ({
        name: r.name,
        code: r.code ?? '',
        account_type: r.account_type,
        parent_id: r.parent_id ?? undefined,
        opening_balance: r.opening_balance ?? undefined,
      })}
      recordLabel={(r) => r.name}
      hooks={hooks}
      enableBulkDelete={false}
    />
  );
}
