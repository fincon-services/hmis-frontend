import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Select, InputNumber, Input } from 'antd';
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
import { useWarehouseItems } from './ItemsPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'warehouse.indents';

export interface IndentRequest {
  id: number;
  department_id: number;
  department_name: string | null;
  requested_by_user_id: number | null;
  indent_no: string | null;
  status: 'pending' | 'issued';
  description: string | null;
  remarks: string | null;
  created_at: string;
}

function useIndentRequests(params: { status?: string; department_id?: number; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['indent-requests', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<IndentRequest> | CollectionResponse<IndentRequest>>('/warehouse/indent-requests', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

const columns: ColumnsType<IndentRequest> = [
  { title: 'Indent No.', dataIndex: 'indent_no', render: (v: string | null) => v ?? '—' },
  { title: 'Department', dataIndex: 'department_name', render: (v: string | null) => v ?? '—' },
  { title: 'Status', dataIndex: 'status', width: 120, render: (v: string) => <StatusBadge label={v} tone={v === 'issued' ? 'success' : 'warning'} /> },
  { title: 'Description', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
  { title: 'Date', dataIndex: 'created_at', width: 160 },
];

export function IndentRequestsPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = useIndentRequests({ status, per_page: pageSize, page });
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);

  const [departmentId, setDepartmentId] = useState<number>();
  const [itemId, setItemId] = useState<number>();
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const onSubmit = () => {
    if (!departmentId || !itemId) {
      message.error('Department and item are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post('/warehouse/indent-requests', { department_id: departmentId, description: description || undefined, items: [{ item_id: itemId, quantity }] }, { screenKey: SCREEN })
      .then(() => {
        message.success('Indent request submitted.');
        setModalOpen(false);
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to submit indent request.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Indent Requests"
        breadcrumbs={[{ label: 'Warehouse' }, { label: 'Indent Requests' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            Submit Indent
          </Button>
        }
      />

      <DataTable<IndentRequest>
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
        onRowClick={(record) => navigate(`/warehouse/indent-requests/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 140 }}
              value={status}
              onChange={setStatus}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Issued', value: 'issued' },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No indent requests found"
      />

      <FormModal title="Submit Indent Request" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Department ID *</label>
          <InputNumber style={{ width: '100%' }} value={departmentId} onChange={(v) => setDepartmentId(v ?? undefined)} min={1} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item *</label>
          <Select style={{ width: '100%' }} options={itemOptions} value={itemId} onChange={setItemId} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity *</label>
          <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? 1)} min={1} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </FormModal>
    </PageContainer>
  );
}
