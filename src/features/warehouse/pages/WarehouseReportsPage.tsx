import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, Table, DatePicker, InputNumber, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/feedback/LoadingState';
import { apiClient } from '@/api/client';
import type { CollectionResponse } from '@/types/api';
import type { WarehouseItem } from './ItemsPage';
import type { StockBatch } from './StockPage';
import type { IndentRequest } from './IndentRequestsPage';

const SCREEN = 'warehouse.reports';

function LevelReportTab({ endpoint }: { endpoint: string }) {
  const query = useQuery({
    queryKey: ['warehouse-report', endpoint],
    queryFn: () => apiClient.get<CollectionResponse<WarehouseItem>>(endpoint, { screenKey: SCREEN }).then((r) => r.data.data),
  });

  const columns: ColumnsType<WarehouseItem> = [
    { title: 'Item', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category_name', render: (v: string | null) => v ?? '—' },
    { title: 'Current Stock', dataIndex: 'current_stock', width: 130 },
    { title: 'Par Level', dataIndex: 'par_level', width: 110, render: (v: number | null) => v ?? '—' },
    { title: 'Panic Level', dataIndex: 'panic_level', width: 110, render: (v: number | null) => v ?? '—' },
  ];

  if (query.isLoading) return <LoadingState rows={3} />;
  return <Table<WarehouseItem> columns={columns} dataSource={query.data} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />;
}

function StockReportTab() {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    setLoading(true);
    apiClient
      .get<Record<string, unknown>[]>('/warehouse/reports/stock', {
        params: { date_from: range?.[0]?.format('YYYY-MM-DD'), date_to: range?.[1]?.format('YYYY-MM-DD') },
        screenKey: SCREEN,
      })
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading}>
          Run
        </Button>
      </div>
      {rows && <Table dataSource={rows} rowKey={(_, i) => String(i)} size="small" pagination={false} scroll={{ x: 'max-content' }} columns={rows[0] ? Object.keys(rows[0]).map((k) => ({ title: k, dataIndex: k })) : []} />}
    </div>
  );
}

function ExpiryReportTab() {
  const [months, setMonths] = useState(3);
  const query = useQuery({
    queryKey: ['warehouse-expiry-report', months],
    queryFn: () => apiClient.get<CollectionResponse<StockBatch>>('/warehouse/reports/expiry', { params: { months }, screenKey: SCREEN }).then((r) => r.data.data),
  });

  const columns: ColumnsType<StockBatch> = [
    { title: 'Item', dataIndex: 'item_name', render: (v: string | null) => v ?? '—' },
    { title: 'Batch', dataIndex: 'batch_no', render: (v: string | null) => v ?? '—' },
    { title: 'Expiry', dataIndex: 'expiry_date' },
    { title: 'Quantity', dataIndex: 'quantity', width: 100 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <InputNumber addonBefore="Months" value={months} onChange={(v) => setMonths(v ?? 3)} min={1} />
      </div>
      {query.isLoading ? <LoadingState rows={3} /> : <Table<StockBatch> columns={columns} dataSource={query.data} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

function IndentReportTab() {
  const [departmentId, setDepartmentId] = useState<number>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [rows, setRows] = useState<IndentRequest[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    setLoading(true);
    apiClient
      .get<CollectionResponse<IndentRequest>>('/warehouse/reports/indents', {
        params: { department_id: departmentId, date_from: range?.[0]?.format('YYYY-MM-DD'), date_to: range?.[1]?.format('YYYY-MM-DD') },
        screenKey: SCREEN,
      })
      .then((r) => setRows(r.data.data))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<IndentRequest> = [
    { title: 'Indent No.', dataIndex: 'indent_no', render: (v: string | null) => v ?? '—' },
    { title: 'Department', dataIndex: 'department_name', render: (v: string | null) => v ?? '—' },
    { title: 'Status', dataIndex: 'status', width: 110 },
    { title: 'Date', dataIndex: 'created_at', width: 160 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <InputNumber placeholder="Department ID" value={departmentId} onChange={(v) => setDepartmentId(v ?? undefined)} min={1} />
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading}>
          Run
        </Button>
      </div>
      {rows && <Table<IndentRequest> columns={columns} dataSource={rows} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

export function WarehouseReportsPage() {
  return (
    <PageContainer>
      <PageHeader title="Warehouse Reports" breadcrumbs={[{ label: 'Warehouse' }, { label: 'Reports' }]} />
      <Tabs
        items={[
          { key: 'par-level', label: 'Par Level', children: <LevelReportTab endpoint="/warehouse/reports/par-level" /> },
          { key: 'panic-level', label: 'Panic Level', children: <LevelReportTab endpoint="/warehouse/reports/panic-level" /> },
          { key: 'stock', label: 'Stock', children: <StockReportTab /> },
          { key: 'expiry', label: 'Expiry', children: <ExpiryReportTab /> },
          { key: 'indents', label: 'Indents', children: <IndentReportTab /> },
        ]}
      />
    </PageContainer>
  );
}
