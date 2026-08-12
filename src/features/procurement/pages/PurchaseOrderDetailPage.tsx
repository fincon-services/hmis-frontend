import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { List, Space } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';

const SCREEN = 'procurement.purchase-orders';

interface PurchaseOrderItem {
  id: number;
  procurement_quotation_item_id: number;
  item_name: string | null;
  quantity: number;
  quantity_remaining: number;
  unit_price: number;
}

interface PurchaseOrderDetail {
  id: number;
  procurement_supplier_id: number;
  supplier_name: string | null;
  address: string | null;
  description: string | null;
  attachment_path: string | null;
  is_received: boolean;
  is_hidden: boolean;
  ordered_at: string | null;
  items: PurchaseOrderItem[];
  purchase_request_ids: number[];
}

function usePurchaseOrderDetail(id: number) {
  return useQuery({
    queryKey: ['purchase-orders', 'detail', id],
    queryFn: () => apiClient.get<PurchaseOrderDetail>(`/procurement/purchase-orders/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

export function PurchaseOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);
  const query = usePurchaseOrderDetail(id);

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

  const po = query.data;

  return (
    <PageContainer>
      <PageHeader
        title={`Purchase Order #${po.id}`}
        breadcrumbs={[{ label: 'Procurement' }, { label: 'Purchase Orders', path: '/procurement/purchase-orders' }, { label: `#${po.id}` }]}
        extra={
          <Space>
            <StatusBadge label={po.is_received ? 'Received' : 'Pending'} tone={po.is_received ? 'success' : 'warning'} />
          </Space>
        }
      />

      <SectionCard title="Order Details">
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Supplier: {po.supplier_name ?? `#${po.procurement_supplier_id}`}</p>
        {po.address && <p style={{ margin: '4px 0 0' }}>Address: {po.address}</p>}
        {po.description && <p style={{ margin: '4px 0 0' }}>{po.description}</p>}
        {po.ordered_at && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Ordered: {po.ordered_at}</p>}
        {po.purchase_request_ids?.length > 0 && (
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>From purchase requests: {po.purchase_request_ids.map((id) => `#${id}`).join(', ')}</p>
        )}
      </SectionCard>

      <SectionCard title="Items">
        {po.items.length === 0 ? (
          <EmptyState title="No items on this order" />
        ) : (
          <List
            dataSource={po.items}
            renderItem={(item) => (
              <List.Item>
                {item.item_name ?? `Item #${item.id}`} — Qty: {item.quantity} (remaining: {item.quantity_remaining}) @ {item.unit_price}
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
