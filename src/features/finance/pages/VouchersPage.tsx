import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Select, Input, InputNumber, DatePicker, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useChartAccountsPlain } from './ChartAccountsPage';
import { useFiscalYearsList } from './FiscalYearsPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'finance.vouchers';

export interface Voucher {
  id: number;
  type: 'journal' | 'bank_payment' | 'cash_payment' | 'bank_receipt' | 'cash_receipt' | 'credit_note';
  voucher_no: string | null;
  finance_fiscal_year_id: number;
  voucher_date: string;
  narration: string | null;
  created_at: string;
}

const voucherTypeOptions = [
  { label: 'Journal', value: 'journal' },
  { label: 'Bank Payment', value: 'bank_payment' },
  { label: 'Cash Payment', value: 'cash_payment' },
  { label: 'Bank Receipt', value: 'bank_receipt' },
  { label: 'Cash Receipt', value: 'cash_receipt' },
  { label: 'Credit Note', value: 'credit_note' },
];

function useVouchers(params: { type?: string; finance_fiscal_year_id?: number; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['finance-vouchers', params],
    queryFn: () => apiClient.get<PaginatedResponse<Voucher> | CollectionResponse<Voucher>>('/finance/vouchers', { params, screenKey: SCREEN }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

interface VoucherLine {
  chart_account_id: number;
  debit_amount?: number;
  credit_amount?: number;
}

const columns: ColumnsType<Voucher> = [
  { title: 'Voucher No.', dataIndex: 'voucher_no', render: (v: string | null) => v ?? '—' },
  { title: 'Type', dataIndex: 'type', width: 140, render: (v: string) => <StatusBadge label={v.replace(/_/g, ' ')} tone="info" /> },
  { title: 'Date', dataIndex: 'voucher_date', width: 140 },
  { title: 'Narration', dataIndex: 'narration', render: (v: string | null) => v ?? '—' },
];

export function VouchersPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const [type, setType] = useState<string>();
  const [fiscalYearId, setFiscalYearId] = useState<number>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = useVouchers({ type, finance_fiscal_year_id: fiscalYearId, per_page: pageSize, page });
  const accountsQuery = useChartAccountsPlain({ per_page: 0 });
  const fiscalYearsQuery = useFiscalYearsList({ per_page: 0 });
  const accountOptions = useMemo(() => (accountsQuery.data?.data ?? []).map((a) => ({ label: a.name, value: a.id })), [accountsQuery.data]);
  const fiscalYearOptions = useMemo(() => (fiscalYearsQuery.data?.data ?? []).map((f) => ({ label: f.name, value: f.id })), [fiscalYearsQuery.data]);

  const [voucherType, setVoucherType] = useState<Voucher['type']>('journal');
  const [voucherFiscalYearId, setVoucherFiscalYearId] = useState<number>();
  const [voucherDate, setVoucherDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [narration, setNarration] = useState('');
  const [supplierId, setSupplierId] = useState<number>();
  const [clientName, setClientName] = useState('');
  const [instrumentReference, setInstrumentReference] = useState('');
  const [lines, setLines] = useState<VoucherLine[]>([{ chart_account_id: undefined as unknown as number }, { chart_account_id: undefined as unknown as number }]);
  const [submitting, setSubmitting] = useState(false);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount ?? 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount ?? 0), 0);

  const resetForm = () => {
    setVoucherType('journal');
    setVoucherFiscalYearId(undefined);
    setVoucherDate(dayjs());
    setNarration('');
    setSupplierId(undefined);
    setClientName('');
    setInstrumentReference('');
    setLines([{ chart_account_id: undefined as unknown as number }, { chart_account_id: undefined as unknown as number }]);
  };

  const updateLine = (index: number, patch: Partial<VoucherLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const onSubmit = () => {
    if (!voucherFiscalYearId || !voucherDate || lines.some((l) => !l.chart_account_id)) {
      message.error('Fiscal year, date, and an account on every line are required.');
      return;
    }
    if (totalDebit !== totalCredit) {
      message.error(`Debits (${totalDebit}) must equal credits (${totalCredit}).`);
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        '/finance/vouchers',
        {
          type: voucherType,
          finance_fiscal_year_id: voucherFiscalYearId,
          voucher_date: voucherDate.format('YYYY-MM-DD'),
          narration: narration || undefined,
          procurement_supplier_id: supplierId,
          client_name: clientName || undefined,
          instrument_reference: instrumentReference || undefined,
          lines: lines.map((l) => ({ chart_account_id: l.chart_account_id, debit_amount: l.debit_amount || undefined, credit_amount: l.credit_amount || undefined })),
        },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Voucher posted.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to post voucher.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Vouchers"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Vouchers' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Post Voucher
          </Button>
        }
      />

      <DataTable<Voucher>
        columns={columns}
        data={rows}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        meta={meta}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onRowClick={(record) => navigate(`/finance/vouchers/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <Select allowClear placeholder="Type" style={{ width: 160 }} value={type} onChange={setType} options={voucherTypeOptions} />
            <Select allowClear placeholder="Fiscal Year" style={{ width: 160 }} value={fiscalYearId} onChange={setFiscalYearId} options={fiscalYearOptions} />
          </FilterBar>
        }
        emptyTitle="No vouchers found"
      />

      <FormModal title="Post Voucher" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting} width={680}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Voucher Type *</label>
            <Select style={{ width: '100%' }} value={voucherType} onChange={setVoucherType} options={voucherTypeOptions} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Fiscal Year *</label>
            <Select style={{ width: '100%' }} value={voucherFiscalYearId} onChange={setVoucherFiscalYearId} options={fiscalYearOptions} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date *</label>
            <DatePicker style={{ width: '100%' }} value={voucherDate} onChange={setVoucherDate} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Narration</label>
          <Input value={narration} onChange={(e) => setNarration(e.target.value)} />
        </div>
        {(voucherType === 'bank_payment' || voucherType === 'cash_payment') && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Supplier ID</label>
            <InputNumber style={{ width: '100%' }} value={supplierId} onChange={(v) => setSupplierId(v ?? undefined)} min={1} />
          </div>
        )}
        {(voucherType === 'bank_receipt' || voucherType === 'cash_receipt') && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Client Name</label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
        )}
        {voucherType !== 'journal' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Instrument Reference</label>
            <Input value={instrumentReference} onChange={(e) => setInstrumentReference(e.target.value)} placeholder="Cheque / instrument no." />
          </div>
        )}

        <Divider style={{ margin: '12px 0' }}>
          Ledger Lines (Debit: {totalDebit} / Credit: {totalCredit})
        </Divider>
        {lines.map((line, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Account</label>
              <Select
                style={{ width: '100%' }}
                options={accountOptions}
                value={line.chart_account_id || undefined}
                onChange={(v) => updateLine(index, { chart_account_id: v })}
                showSearch
                optionFilterProp="label"
              />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Debit</label>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} value={line.debit_amount} onChange={(v) => updateLine(index, { debit_amount: v ?? undefined })} />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Credit</label>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} value={line.credit_amount} onChange={(v) => updateLine(index, { credit_amount: v ?? undefined })} />
            </div>
            {lines.length > 2 && (
              <Button danger size="small" onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button size="small" icon={<Plus size={14} />} onClick={() => setLines((prev) => [...prev, { chart_account_id: undefined as unknown as number }])}>
          Add Line
        </Button>
      </FormModal>
    </PageContainer>
  );
}
