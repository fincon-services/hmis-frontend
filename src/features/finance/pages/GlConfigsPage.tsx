import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, List, Select, Button, Space } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';
import { useChartAccountsPlain } from './ChartAccountsPage';
import type { CollectionResponse } from '@/types/api';

const SCREEN = 'finance.setup';

interface GlConfig {
  id: number;
  transaction_type: 'salary' | 'invoice';
  finance_chart_account_id: number;
  account_name: string | null;
  side: 'debit' | 'credit';
}

function useGlConfigs(transactionType: string) {
  return useQuery({
    queryKey: ['finance-gl-configs', transactionType],
    queryFn: () => apiClient.get<CollectionResponse<GlConfig>>(`/finance/gl-configs/${transactionType}`, { screenKey: SCREEN }).then((r) => r.data.data),
  });
}

function GlConfigTab({ transactionType }: { transactionType: 'salary' | 'invoice' }) {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useGlConfigs(transactionType);
  const accountsQuery = useChartAccountsPlain({ per_page: 0 });
  const accountOptions = useMemo(() => (accountsQuery.data?.data ?? []).map((a) => ({ label: a.name, value: a.id })), [accountsQuery.data]);

  const [accountId, setAccountId] = useState<number>();
  const [side, setSide] = useState<'debit' | 'credit'>('debit');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const onAdd = () => {
    if (!accountId) {
      message.error('Account is required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post('/finance/gl-configs', { transaction_type: transactionType, finance_chart_account_id: accountId, side }, { screenKey: SCREEN })
      .then(() => {
        message.success('GL config line added.');
        setAccountId(undefined);
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to add GL config line.')))
      .finally(() => setSubmitting(false));
  };

  const onRemove = (config: GlConfig) => {
    confirm({
      title: 'Remove this GL posting line?',
      okText: 'Remove',
      danger: true,
      onConfirm: () => {
        setRemovingId(config.id);
        apiClient
          .delete(`/finance/gl-configs/${config.id}`, { screenKey: SCREEN })
          .then(() => {
            message.success('GL config line removed.');
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to remove GL config line.')))
          .finally(() => setRemovingId(null));
      },
    });
  };

  return (
    <SectionCard title={`${transactionType === 'salary' ? 'Salary' : 'Invoice'} Posting Template`}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <Select style={{ width: 240 }} placeholder="Chart Account" options={accountOptions} value={accountId} onChange={setAccountId} showSearch optionFilterProp="label" />
        <Select
          style={{ width: 140 }}
          value={side}
          onChange={setSide}
          options={[
            { label: 'Debit', value: 'debit' },
            { label: 'Credit', value: 'credit' },
          ]}
        />
        <Button type="primary" icon={<Plus size={14} />} onClick={onAdd} loading={submitting}>
          Add Line
        </Button>
      </div>

      {query.isLoading ? (
        <LoadingState rows={2} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No posting lines configured" />
      ) : (
        <List
          dataSource={query.data}
          renderItem={(config) => (
            <List.Item
              extra={
                <Button danger size="small" icon={<Trash2 size={14} />} loading={removingId === config.id} onClick={() => onRemove(config)}>
                  Remove
                </Button>
              }
            >
              <Space>
                {config.account_name ?? `Account #${config.finance_chart_account_id}`}
                <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>({config.side})</span>
              </Space>
            </List.Item>
          )}
        />
      )}
    </SectionCard>
  );
}

export function GlConfigsPage() {
  return (
    <PageContainer>
      <PageHeader title="GL Posting Templates" breadcrumbs={[{ label: 'Finance' }, { label: 'GL Configs' }]} />
      <Tabs
        items={[
          { key: 'salary', label: 'Salary', children: <GlConfigTab transactionType="salary" /> },
          { key: 'invoice', label: 'Invoice', children: <GlConfigTab transactionType="invoice" /> },
        ]}
      />
    </PageContainer>
  );
}
