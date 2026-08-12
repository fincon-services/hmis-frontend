import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, InputNumber, DatePicker, List, Select, Space, Divider } from 'antd';
import { Check, X, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FormModal } from '@/components/modals/FormModal';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';
import { queryClient } from '@/api/queryClient';
import { useSuppliers } from './SuppliersPage';
import { useWarehouseItems } from '@/features/warehouse/pages/ItemsPage';

const SCREEN = 'procurement.purchase-requests';
const QUOTATION_SCREEN = 'procurement.quotations';

interface PurchaseRequestItem {
  id: number;
  item_id: number;
  item_name: string | null;
  quantity: number;
}

interface QuotationItem {
  id: number;
  warehouse_item_id: number;
  item_name: string | null;
  quantity: number;
  quantity_remaining: number;
  unit_price: number;
  expiry_date: string | null;
  is_ordered: boolean;
}

interface Quotation {
  id: number;
  procurement_supplier_id: number;
  supplier_name: string | null;
  attachment_path: string | null;
  validity: string | null;
  description: string | null;
  status: 'pending' | 'approved';
  quoted_at: string | null;
  items: QuotationItem[];
}

interface PurchaseRequestDetail {
  id: number;
  department_id: number;
  department_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  description: string | null;
  remarks: string | null;
  items: PurchaseRequestItem[];
  quotations: Quotation[];
  created_at: string;
}

const statusTone: Record<string, 'success' | 'warning' | 'error'> = { approved: 'success', pending: 'warning', rejected: 'error' };

function usePurchaseRequestDetail(id: number) {
  return useQuery({
    queryKey: ['purchase-requests', 'detail', id],
    queryFn: () => apiClient.get<PurchaseRequestDetail>(`/procurement/purchase-requests/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

interface QuoteLine {
  item_id: number;
  quantity: number;
  unit_price: number;
  expiry_date?: string;
}

export function PurchaseRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const id = Number(requestId);
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = usePurchaseRequestDetail(id);
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const suppliersQuery = useSuppliers({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);
  const supplierOptions = useMemo(() => (suppliersQuery.data?.data ?? []).map((s) => ({ label: s.company_name, value: s.id })), [suppliersQuery.data]);

  const [deciding, setDeciding] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<number>();
  const [validity, setValidity] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<QuoteLine[]>([{ item_id: undefined as unknown as number, quantity: 1, unit_price: 0 }]);
  const [submittingQuote, setSubmittingQuote] = useState(false);

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

  const pr = query.data;

  const onDecide = (approve: boolean) => {
    confirm({
      title: approve ? 'Approve this purchase request?' : 'Reject this purchase request?',
      onConfirm: () => {
        setDeciding(true);
        apiClient
          .post(`/procurement/purchase-requests/${id}/decision`, { approve }, { screenKey: SCREEN })
          .then(() => {
            message.success(approve ? 'Purchase request approved.' : 'Purchase request rejected.');
            queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to record decision on purchase request.')))
          .finally(() => setDeciding(false));
      },
    });
  };

  const onApproveQuotation = (quotationId: number) => {
    confirm({
      title: 'Approve this quotation?',
      onConfirm: () => {
        setApproving(quotationId);
        apiClient
          .post(`/procurement/quotations/${quotationId}/approve`, {}, { screenKey: QUOTATION_SCREEN })
          .then(() => {
            message.success('Quotation approved.');
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to approve quotation.')))
          .finally(() => setApproving(null));
      },
    });
  };

  const resetQuoteForm = () => {
    setSupplierId(undefined);
    setValidity('');
    setDescription('');
    setLines([{ item_id: undefined as unknown as number, quantity: 1, unit_price: 0 }]);
  };

  const updateLine = (index: number, patch: Partial<QuoteLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const onSubmitQuotation = () => {
    if (!supplierId || lines.some((l) => !l.item_id)) {
      message.error('Supplier and item are required on every line.');
      return;
    }
    setSubmittingQuote(true);
    apiClient
      .post(
        `/procurement/purchase-requests/${id}/quotations`,
        {
          procurement_supplier_id: supplierId,
          validity: validity || undefined,
          description: description || undefined,
          items: lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity, unit_price: l.unit_price, expiry_date: l.expiry_date || undefined })),
        },
        { screenKey: QUOTATION_SCREEN },
      )
      .then(() => {
        message.success('Quotation recorded.');
        setQuoteModalOpen(false);
        resetQuoteForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to record quotation.')))
      .finally(() => setSubmittingQuote(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Purchase Request #${pr.id}`}
        breadcrumbs={[{ label: 'Procurement' }, { label: 'Purchase Requests', path: '/procurement/purchase-requests' }, { label: `#${pr.id}` }]}
        extra={
          <Space>
            <StatusBadge label={pr.status} tone={statusTone[pr.status] ?? 'default'} />
            {pr.status === 'pending' && (
              <>
                <Button icon={<Check size={14} />} type="primary" onClick={() => onDecide(true)} loading={deciding}>
                  Approve
                </Button>
                <Button icon={<X size={14} />} danger onClick={() => onDecide(false)} loading={deciding}>
                  Reject
                </Button>
              </>
            )}
          </Space>
        }
      />

      <SectionCard title="Request Details">
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Department: {pr.department_name ?? `#${pr.department_id}`}</p>
        {pr.description && <p style={{ margin: '4px 0 0' }}>{pr.description}</p>}
        {pr.remarks && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Remarks: {pr.remarks}</p>}
      </SectionCard>

      <SectionCard title="Items">
        {pr.items.length === 0 ? (
          <EmptyState title="No items on this request" />
        ) : (
          <List dataSource={pr.items} renderItem={(item) => <List.Item>{item.item_name ?? `Item #${item.item_id}`} — Quantity: {item.quantity}</List.Item>} />
        )}
      </SectionCard>

      <SectionCard
        title="Quotations"
        extra={
          pr.status === 'approved' ? (
            <Button size="small" icon={<Plus size={14} />} onClick={() => setQuoteModalOpen(true)}>
              Record Quotation
            </Button>
          ) : undefined
        }
      >
        {pr.quotations.length === 0 ? (
          <EmptyState title="No quotations recorded yet" />
        ) : (
          pr.quotations.map((q) => (
            <div key={q.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{q.supplier_name ?? `Supplier #${q.procurement_supplier_id}`}</strong>
                <Space>
                  <StatusBadge label={q.status} tone={q.status === 'approved' ? 'success' : 'warning'} />
                  {q.status === 'pending' && (
                    <Button size="small" type="primary" loading={approving === q.id} onClick={() => onApproveQuotation(q.id)}>
                      Approve Quotation
                    </Button>
                  )}
                </Space>
              </div>
              {q.validity && <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>Valid until: {q.validity}</p>}
              <List
                style={{ marginTop: 8 }}
                size="small"
                dataSource={q.items}
                renderItem={(item) => (
                  <List.Item>
                    {item.item_name ?? `Item #${item.warehouse_item_id}`} — Qty: {item.quantity} @ {item.unit_price} {item.is_ordered ? <StatusBadge label="Ordered" tone="info" /> : null}
                  </List.Item>
                )}
              />
            </div>
          ))
        )}
      </SectionCard>

      <FormModal
        title="Record Supplier Quotation"
        open={quoteModalOpen}
        onCancel={() => setQuoteModalOpen(false)}
        onSubmit={onSubmitQuotation}
        confirmLoading={submittingQuote}
        width={640}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Supplier *</label>
          <Select style={{ width: '100%' }} options={supplierOptions} value={supplierId} onChange={setSupplierId} showSearch optionFilterProp="label" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Validity</label>
          <Input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="e.g. 30 days" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Divider style={{ margin: '12px 0' }}>Quoted Items</Divider>
        {lines.map((line, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Item</label>
              <Select style={{ width: '100%' }} options={itemOptions} value={line.item_id || undefined} onChange={(v) => updateLine(index, { item_id: v })} showSearch optionFilterProp="label" />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Quantity</label>
              <InputNumber style={{ width: '100%' }} min={1} value={line.quantity} onChange={(v) => updateLine(index, { quantity: v ?? 1 })} />
            </div>
            <div style={{ width: 110 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Unit Price</label>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} value={line.unit_price} onChange={(v) => updateLine(index, { unit_price: v ?? 0 })} />
            </div>
            <div style={{ width: 150 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Expiry Date</label>
              <DatePicker
                style={{ width: '100%' }}
                value={line.expiry_date ? dayjs(line.expiry_date) : null}
                onChange={(d) => updateLine(index, { expiry_date: d ? d.format('YYYY-MM-DD') : undefined })}
              />
            </div>
            {lines.length > 1 && (
              <Button danger size="small" onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button size="small" icon={<Plus size={14} />} onClick={() => setLines((prev) => [...prev, { item_id: undefined as unknown as number, quantity: 1, unit_price: 0 }])}>
          Add Line
        </Button>
      </FormModal>
    </PageContainer>
  );
}
