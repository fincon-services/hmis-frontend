import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Select, Input, Checkbox, Empty, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useSuppliers } from './SuppliersPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'procurement.purchase-orders';

export interface PurchaseOrder {
  id: number;
  procurement_supplier_id: number;
  supplier_name: string | null;
  address: string | null;
  description: string | null;
  attachment_path: string | null;
  is_received: boolean;
  is_hidden: boolean;
  ordered_at: string | null;
}

interface AvailableQuotationItem {
  id: number;
  warehouse_item_id: number;
  item_name: string | null;
  quantity: number;
  quantity_remaining: number;
  unit_price: number;
  expiry_date: string | null;
}

function usePurchaseOrders(params: { pending?: boolean; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<PurchaseOrder> | CollectionResponse<PurchaseOrder>>('/procurement/purchase-orders', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

function useAvailableQuotationItems(supplierId?: number) {
  return useQuery({
    queryKey: ['purchase-orders', 'available-quotation-items', supplierId],
    queryFn: () =>
      apiClient
        .get<CollectionResponse<AvailableQuotationItem>>('/procurement/purchase-orders/available-quotation-items', { params: { supplier_id: supplierId }, screenKey: SCREEN })
        .then((r) => r.data.data),
    enabled: !!supplierId,
  });
}

const columns: ColumnsType<PurchaseOrder> = [
  { title: 'Supplier', dataIndex: 'supplier_name', render: (v: string | null, r) => v ?? `Supplier #${r.procurement_supplier_id}` },
  { title: 'Status', dataIndex: 'is_received', width: 130, render: (v: boolean) => <StatusBadge label={v ? 'Received' : 'Pending'} tone={v ? 'success' : 'warning'} /> },
  { title: 'Description', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
  { title: 'Ordered', dataIndex: 'ordered_at', width: 160, render: (v: string | null) => v ?? '—' },
];

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const [pendingOnly, setPendingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = usePurchaseOrders({ pending: pendingOnly || undefined, per_page: pageSize, page });
  const suppliersQuery = useSuppliers({ per_page: 0 });
  const supplierOptions = useMemo(() => (suppliersQuery.data?.data ?? []).map((s) => ({ label: s.company_name, value: s.id })), [suppliersQuery.data]);

  const [supplierId, setSupplierId] = useState<number>();
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentPath, setAttachmentPath] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableItemsQuery = useAvailableQuotationItems(supplierId);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const resetForm = () => {
    setSupplierId(undefined);
    setSelectedItemIds([]);
    setAddress('');
    setDescription('');
    setAttachmentPath('');
  };

  const onSubmit = () => {
    if (!supplierId || selectedItemIds.length === 0) {
      message.error('Supplier and at least one quotation item are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        '/procurement/purchase-orders',
        {
          procurement_supplier_id: supplierId,
          quotation_item_ids: selectedItemIds,
          address: address || undefined,
          description: description || undefined,
          attachment_path: attachmentPath || undefined,
        },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Purchase order created.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to create purchase order.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders"
        breadcrumbs={[{ label: 'Procurement' }, { label: 'Purchase Orders' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            New Purchase Order
          </Button>
        }
      />

      <DataTable<PurchaseOrder>
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
        onRowClick={(record) => navigate(`/procurement/purchase-orders/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <Switch checked={pendingOnly} onChange={setPendingOnly} checkedChildren="Pending only" unCheckedChildren="All" />
          </FilterBar>
        }
        emptyTitle="No purchase orders found"
      />

      <FormModal title="Create Purchase Order" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting} width={640}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Supplier *</label>
          <Select
            style={{ width: '100%' }}
            options={supplierOptions}
            value={supplierId}
            onChange={(v) => {
              setSupplierId(v);
              setSelectedItemIds([]);
            }}
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Approved Quotation Items *</label>
          {!supplierId ? (
            <Empty description="Select a supplier first" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : availableItemsQuery.isLoading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading available items…</p>
          ) : (availableItemsQuery.data?.length ?? 0) === 0 ? (
            <Empty description="No approved quotation items available for this supplier" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Checkbox.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              value={selectedItemIds}
              onChange={(v) => setSelectedItemIds(v as number[])}
              options={(availableItemsQuery.data ?? []).map((item) => ({
                label: `${item.item_name ?? `Item #${item.warehouse_item_id}`} — Qty remaining: ${item.quantity_remaining} @ ${item.unit_price}`,
                value: item.id,
              }))}
            />
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Delivery Address</label>
          <Input.TextArea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Attachment Path / Reference</label>
          <Input value={attachmentPath} onChange={(e) => setAttachmentPath(e.target.value)} />
        </div>
      </FormModal>
    </PageContainer>
  );
}
