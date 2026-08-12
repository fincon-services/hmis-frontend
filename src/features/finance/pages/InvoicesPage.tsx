import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Select, Input, InputNumber, DatePicker } from 'antd';
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
import { useSuppliers } from '@/features/procurement/pages/SuppliersPage';
import { useWarehouseItems } from '@/features/warehouse/pages/ItemsPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'finance.invoices';

export interface FinanceInvoice {
  id: number;
  warehouse_stock_receipt_id: number;
  procurement_supplier_id: number;
  supplier_name: string | null;
  invoice_number: string;
  invoice_date: string;
  is_posted: boolean;
}

function useFinanceInvoices(params: { is_posted?: boolean; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['finance-invoices', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<FinanceInvoice> | CollectionResponse<FinanceInvoice>>('/finance/invoices', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

const columns: ColumnsType<FinanceInvoice> = [
  { title: 'Invoice No.', dataIndex: 'invoice_number' },
  { title: 'Supplier', dataIndex: 'supplier_name', render: (v: string | null, r) => v ?? `Supplier #${r.procurement_supplier_id}` },
  { title: 'Date', dataIndex: 'invoice_date', width: 140 },
  { title: 'Status', dataIndex: 'is_posted', width: 120, render: (v: boolean) => <StatusBadge label={v ? 'Posted' : 'Unposted'} tone={v ? 'success' : 'warning'} /> },
];

export function InvoicesPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const [isPostedFilter, setIsPostedFilter] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = useFinanceInvoices({ is_posted: isPostedFilter, per_page: pageSize, page });
  const suppliersQuery = useSuppliers({ per_page: 0 });
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const supplierOptions = useMemo(() => (suppliersQuery.data?.data ?? []).map((s) => ({ label: s.company_name, value: s.id })), [suppliersQuery.data]);
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);

  const [stockReceiptId, setStockReceiptId] = useState<number>();
  const [supplierId, setSupplierId] = useState<number>();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [itemId, setItemId] = useState<number>();
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const resetForm = () => {
    setStockReceiptId(undefined);
    setSupplierId(undefined);
    setInvoiceNumber('');
    setInvoiceDate(dayjs());
    setItemId(undefined);
    setQuantity(1);
    setUnitPrice(0);
  };

  const onSubmit = () => {
    if (!stockReceiptId || !supplierId || !invoiceNumber || !invoiceDate || !itemId) {
      message.error('GRN receipt, supplier, invoice number, date, and item are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        `/finance/warehouse-receipts/${stockReceiptId}/invoice`,
        {
          procurement_supplier_id: supplierId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate.format('YYYY-MM-DD'),
          items: [{ item_id: itemId, quantity, unit_price: unitPrice }],
        },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Finance invoice created.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to create finance invoice.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Finance Invoices"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Invoices' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            New Invoice
          </Button>
        }
      />

      <DataTable<FinanceInvoice>
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
        onRowClick={(record) => navigate(`/finance/invoices/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 140 }}
              value={isPostedFilter}
              onChange={setIsPostedFilter}
              options={[
                { label: 'Posted', value: true },
                { label: 'Unposted', value: false },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No finance invoices found"
      />

      <FormModal title="Create Finance Invoice from GRN" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting} width={620}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>GRN Stock Receipt ID *</label>
          <InputNumber style={{ width: '100%' }} value={stockReceiptId} onChange={(v) => setStockReceiptId(v ?? undefined)} min={1} />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            The ID returned when stock was received via Warehouse → Stock → Receive Stock.
          </p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Supplier *</label>
          <Select style={{ width: '100%' }} options={supplierOptions} value={supplierId} onChange={setSupplierId} showSearch optionFilterProp="label" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Invoice Number *</label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div style={{ flex: 1, marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Invoice Date *</label>
            <DatePicker style={{ width: '100%' }} value={invoiceDate} onChange={setInvoiceDate} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item *</label>
          <Select style={{ width: '100%' }} options={itemOptions} value={itemId} onChange={setItemId} showSearch optionFilterProp="label" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity *</label>
            <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? 1)} min={1} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Unit Price *</label>
            <InputNumber style={{ width: '100%' }} value={unitPrice} onChange={(v) => setUnitPrice(v ?? 0)} min={0} step={0.01} />
          </div>
        </div>
      </FormModal>
    </PageContainer>
  );
}
