import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Select, InputNumber, Input, DatePicker, Tabs, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable } from '@/components/tables/DataTable';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { List } from 'antd';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useWarehouseItems } from './ItemsPage';
import { useLocations } from './LocationsPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'warehouse.stock';

export interface StockBatch {
  id: number;
  warehouse_item_id: number;
  item_name: string | null;
  warehouse_location_id: number | null;
  batch_no: string | null;
  expiry_date: string | null;
  quantity: number;
  original_quantity: number;
  source: string;
  received_at: string;
}

function useStockBatches(params: { warehouse_item_id?: number; available?: boolean; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['stock-batches', params],
    queryFn: () => apiClient.get<PaginatedResponse<StockBatch> | CollectionResponse<StockBatch>>('/warehouse/stock-batches', { params, screenKey: SCREEN }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

function useNearExpiry(months: number) {
  return useQuery({
    queryKey: ['stock-batches', 'near-expiry', months],
    queryFn: () => apiClient.get<CollectionResponse<StockBatch>>('/warehouse/stock-batches/near-expiry', { params: { months }, screenKey: SCREEN }).then((r) => r.data.data),
  });
}

function ReturnToVendorModal({ batch, onClose }: { batch: StockBatch; onClose: () => void }) {
  const { message } = useFeedback();
  const [quantity, setQuantity] = useState<number>();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    if (!quantity) {
      message.error('Enter a quantity.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(`/warehouse/stock-batches/${batch.id}/return-to-vendor`, { quantity, reason: reason || undefined }, { screenKey: SCREEN })
      .then(() => {
        message.success('Stock returned to vendor.');
        onClose();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to return stock to vendor.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <Modal title={`Return to Vendor — ${batch.item_name}`} open onCancel={onClose} onOk={onSubmit} confirmLoading={submitting} okText="Return">
      <p style={{ color: '#4d5c6b', fontSize: 13 }}>Batch quantity available: {batch.quantity}</p>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity</label>
        <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? undefined)} min={1} max={batch.quantity} />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Reason</label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}

function BatchesTab() {
  const [itemId, setItemId] = useState<number>();
  const [available, setAvailable] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [returnTarget, setReturnTarget] = useState<StockBatch | null>(null);

  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);
  const query = useStockBatches({ warehouse_item_id: itemId, available, per_page: pageSize, page });
  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const columns: ColumnsType<StockBatch> = [
    { title: 'Item', dataIndex: 'item_name', render: (v: string | null) => v ?? '—' },
    { title: 'Batch No.', dataIndex: 'batch_no', render: (v: string | null) => v ?? '—' },
    { title: 'Expiry', dataIndex: 'expiry_date', render: (v: string | null) => v ?? '—' },
    { title: 'Quantity', key: 'qty', render: (_, r) => `${r.quantity} / ${r.original_quantity}` },
    { title: 'Source', dataIndex: 'source', width: 110 },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, record) => (record.quantity > 0 ? <Button size="small" onClick={() => setReturnTarget(record)}>Return to Vendor</Button> : null),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select allowClear placeholder="Item" style={{ width: 220 }} options={itemOptions} value={itemId} onChange={setItemId} />
        <Select
          allowClear
          placeholder="Availability"
          style={{ width: 160 }}
          value={available}
          onChange={setAvailable}
          options={[{ label: 'Available only', value: true }]}
        />
      </div>
      <DataTable<StockBatch>
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
        emptyTitle="No stock batches found"
      />
      {returnTarget && <ReturnToVendorModal batch={returnTarget} onClose={() => setReturnTarget(null)} />}
    </>
  );
}

function NearExpiryTab() {
  const query = useNearExpiry(3);
  if (query.isLoading) return <LoadingState rows={3} />;
  if ((query.data?.length ?? 0) === 0) return <EmptyState title="No batches nearing expiry" />;
  return (
    <List
      dataSource={query.data}
      renderItem={(b) => (
        <List.Item>
          {b.item_name} — Batch {b.batch_no ?? '—'} — Expires {b.expiry_date} — Qty {b.quantity}
        </List.Item>
      )}
    />
  );
}

function ReceiveStockTab() {
  const { message } = useFeedback();
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const locationsQuery = useLocations({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);
  const locationOptions = useMemo(() => (locationsQuery.data?.data ?? []).map((l) => ({ label: l.name, value: l.id })), [locationsQuery.data]);

  const [itemId, setItemId] = useState<number>();
  const [locationId, setLocationId] = useState<number>();
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState<dayjs.Dayjs | null>(null);
  const [quantity, setQuantity] = useState<number>();
  const [reference, setReference] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    if (!itemId || !quantity) {
      message.error('Item and quantity are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        '/warehouse/stock-receipts',
        {
          reference: reference || undefined,
          supplier_name: supplierName || undefined,
          lines: [{ item_id: itemId, location_id: locationId, batch_no: batchNo || undefined, expiry_date: expiryDate?.format('YYYY-MM-DD'), quantity }],
        },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Stock received.');
        setQuantity(undefined);
        setBatchNo('');
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to receive stock.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item *</label>
        <Select style={{ width: '100%' }} options={itemOptions} value={itemId} onChange={setItemId} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Location</label>
        <Select allowClear style={{ width: '100%' }} options={locationOptions} value={locationId} onChange={setLocationId} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Batch Number</label>
        <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Expiry Date</label>
        <DatePicker style={{ width: '100%' }} value={expiryDate} onChange={setExpiryDate} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity *</label>
        <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? undefined)} min={1} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Reference (PO/GRN)</label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Supplier Name</label>
        <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
      </div>
      <Button type="primary" onClick={onSubmit} loading={submitting}>
        Receive Stock
      </Button>
    </div>
  );
}

function DonationTab() {
  const { message } = useFeedback();
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);

  const [itemId, setItemId] = useState<number>();
  const [quantity, setQuantity] = useState<number>();
  const [donatedBy, setDonatedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    if (!itemId || !quantity) {
      message.error('Item and quantity are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post('/warehouse/stock-donations', { item_id: itemId, quantity, donated_by: donatedBy || undefined, donation_remarks: remarks || undefined }, { screenKey: SCREEN })
      .then(() => {
        message.success('Donation received.');
        setQuantity(undefined);
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to record donation.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item *</label>
        <Select style={{ width: '100%' }} options={itemOptions} value={itemId} onChange={setItemId} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity *</label>
        <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? undefined)} min={1} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Donated By</label>
        <Input value={donatedBy} onChange={(e) => setDonatedBy(e.target.value)} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Remarks</label>
        <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <Button type="primary" onClick={onSubmit} loading={submitting}>
        Receive Donation
      </Button>
    </div>
  );
}

export function StockPage() {
  return (
    <PageContainer>
      <PageHeader title="Warehouse Stock" breadcrumbs={[{ label: 'Warehouse' }, { label: 'Stock' }]} />
      <SectionCard title="">
        <Tabs
          items={[
            { key: 'batches', label: 'Stock Batches', children: <BatchesTab /> },
            { key: 'near-expiry', label: 'Near Expiry', children: <NearExpiryTab /> },
            { key: 'receive', label: 'Receive Stock (GRN)', children: <ReceiveStockTab /> },
            { key: 'donation', label: 'Receive Donation', children: <DonationTab /> },
          ]}
        />
      </SectionCard>
    </PageContainer>
  );
}
