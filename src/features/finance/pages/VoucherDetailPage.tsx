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

const SCREEN = 'finance.vouchers';

interface VoucherLedgerLine {
  id: number;
  finance_chart_account_id: number;
  account_name: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  entry_date: string;
}

interface VoucherDetail {
  id: number;
  type: string;
  voucher_no: string | null;
  voucher_date: string;
  narration: string | null;
  client_name: string | null;
  instrument_reference: string | null;
  total_debit: number;
  total_credit: number;
  lines: VoucherLedgerLine[];
  created_at: string;
}

function useVoucherDetail(id: number) {
  return useQuery({
    queryKey: ['finance-vouchers', 'detail', id],
    queryFn: () => apiClient.get<VoucherDetail>(`/finance/vouchers/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

export function VoucherDetailPage() {
  const { voucherId } = useParams<{ voucherId: string }>();
  const id = Number(voucherId);
  const query = useVoucherDetail(id);

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

  const voucher = query.data;

  return (
    <PageContainer>
      <PageHeader
        title={`Voucher ${voucher.voucher_no ?? `#${voucher.id}`}`}
        breadcrumbs={[{ label: 'Finance' }, { label: 'Vouchers', path: '/finance/vouchers' }, { label: voucher.voucher_no ?? `#${voucher.id}` }]}
        extra={<StatusBadge label={voucher.type.replace(/_/g, ' ')} tone="info" />}
      />

      <SectionCard title="Voucher Details">
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Date: {voucher.voucher_date}</p>
        {voucher.narration && <p style={{ margin: '4px 0 0' }}>{voucher.narration}</p>}
        {voucher.client_name && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Client: {voucher.client_name}</p>}
        {voucher.instrument_reference && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Instrument Ref: {voucher.instrument_reference}</p>}
        <p style={{ margin: '8px 0 0', fontWeight: 500 }}>
          Total Debit: {voucher.total_debit} — Total Credit: {voucher.total_credit}
        </p>
      </SectionCard>

      <SectionCard title="Ledger Lines">
        {voucher.lines.length === 0 ? (
          <EmptyState title="No ledger lines" />
        ) : (
          <List
            dataSource={voucher.lines}
            renderItem={(line) => (
              <List.Item>
                {line.account_name ?? `Account #${line.finance_chart_account_id}`} — Debit: {line.debit_amount ?? 0} — Credit: {line.credit_amount ?? 0}
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
