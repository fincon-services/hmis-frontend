import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, InputNumber, List } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { queryClient } from '@/api/queryClient';

const SCREEN = 'warehouse.indents';

interface IndentItem {
  id: number;
  item_id: number;
  item_name: string | null;
  quantity: number;
}

interface IndentDetail {
  id: number;
  department_name: string | null;
  status: 'pending' | 'issued';
  description: string | null;
  remarks: string | null;
  items: IndentItem[];
}

function useIndentDetail(id: number) {
  return useQuery({
    queryKey: ['indent-requests', 'detail', id],
    queryFn: () => apiClient.get<IndentDetail>(`/warehouse/indent-requests/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

export function IndentRequestDetailPage() {
  const { indentId } = useParams<{ indentId: string }>();
  const id = Number(indentId);
  const { message } = useFeedback();
  const query = useIndentDetail(id);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [issuing, setIssuing] = useState(false);

  if (query.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  if (query.error || !query.data) {
    return (
      <PageContainer>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </PageContainer>
    );
  }

  const indent = query.data;

  const onIssue = () => {
    const issued_quantities = indent.items.map((item) => ({ request_item_id: item.id, quantity: quantities[item.id] ?? item.quantity }));
    setIssuing(true);
    apiClient
      .post(`/warehouse/indent-requests/${id}/issue`, { issued_quantities }, { screenKey: SCREEN })
      .then(() => {
        message.success('Indent issued (FEFO).');
        queryClient.invalidateQueries({ queryKey: ['indent-requests'] });
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to issue indent.')))
      .finally(() => setIssuing(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Indent Request #${indent.id}`}
        breadcrumbs={[{ label: 'Warehouse' }, { label: 'Indent Requests', path: '/warehouse/indent-requests' }, { label: `#${indent.id}` }]}
        extra={<StatusBadge label={indent.status} tone={indent.status === 'issued' ? 'success' : 'warning'} />}
      />

      <SectionCard title="Items">
        {indent.items.length === 0 ? (
          <EmptyState title="No items on this indent" />
        ) : (
          <List
            dataSource={indent.items}
            renderItem={(item) => (
              <List.Item
                extra={
                  indent.status === 'pending' ? (
                    <InputNumber
                      value={quantities[item.id] ?? item.quantity}
                      onChange={(v) => setQuantities((prev) => ({ ...prev, [item.id]: v ?? item.quantity }))}
                      min={0}
                      max={item.quantity}
                    />
                  ) : undefined
                }
              >
                {item.item_name ?? `Item #${item.item_id}`} — Requested: {item.quantity}
              </List.Item>
            )}
          />
        )}
        {indent.status === 'pending' && (
          <Button type="primary" onClick={onIssue} loading={issuing} style={{ marginTop: 12 }}>
            Issue Stock (FEFO)
          </Button>
        )}
      </SectionCard>
    </PageContainer>
  );
}
