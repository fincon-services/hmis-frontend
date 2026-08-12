import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { List } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';

const SCREEN = 'finance.invoices';

interface FinanceInvoiceItem {
  id: number;
  warehouse_item_id: number;
  item_name: string | null;
  quantity: number;
  unit_price: number;
}

interface FinanceInvoiceDetail {
  id: number;
  warehouse_stock_receipt_id: number;
  procurement_supplier_id: number;
  supplier_name: string | null;
  invoice_number: string;
  invoice_date: string;
  is_posted: boolean;
  items: FinanceInvoiceItem[];
}

function useFinanceInvoiceDetail(id: number) {
  return useQuery({
    queryKey: ['finance-invoices', 'detail', id],
    queryFn: () => apiClient.get<FinanceInvoiceDetail>(`/finance/invoices/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const id = Number(invoiceId);
  const query = useFinanceInvoiceDetail(id);

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

  const invoice = query.data;

  return (
    <PageContainer>
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices', path: '/finance/invoices' }, { label: invoice.invoice_number }]}
        extra={<StatusBadge label={invoice.is_posted ? 'Posted' : 'Unposted'} tone={invoice.is_posted ? 'success' : 'warning'} />}
      />

      <SectionCard title="Invoice Details">
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Supplier: {invoice.supplier_name ?? `#${invoice.procurement_supplier_id}`}</p>
        <p style={{ margin: '4px 0 0' }}>Date: {invoice.invoice_date}</p>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>GRN Stock Receipt #{invoice.warehouse_stock_receipt_id}</p>
        {!invoice.is_posted && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            This invoice has not been posted to the ledger yet — post a Journal Voucher of type "invoice" referencing it under Vouchers.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Items">
        {invoice.items.length === 0 ? (
          <EmptyState title="No items on this invoice" />
        ) : (
          <List
            dataSource={invoice.items}
            renderItem={(item) => (
              <List.Item>
                {item.item_name ?? `Item #${item.warehouse_item_id}`} — Qty: {item.quantity} @ {item.unit_price}
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
