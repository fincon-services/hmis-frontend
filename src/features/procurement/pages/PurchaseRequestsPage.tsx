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
import { useWarehouseItems } from '@/features/warehouse/pages/ItemsPage';
import { useItemCategories } from '@/features/warehouse/pages/ItemCategoriesPage';
import { useItemSubCategories } from '@/features/warehouse/pages/ItemSubCategoriesPage';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'procurement.purchase-requests';

export interface PurchaseRequest {
  id: number;
  department_id: number;
  department_name: string | null;
  warehouse_item_category_id: number;
  warehouse_item_sub_category_id: number | null;
  requested_by_user_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  description: string | null;
  remarks: string | null;
  created_at: string;
}

function usePurchaseRequests(params: { status?: string; department_id?: number; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['purchase-requests', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<PurchaseRequest> | CollectionResponse<PurchaseRequest>>('/procurement/purchase-requests', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

const statusTone: Record<string, 'success' | 'warning' | 'error'> = { approved: 'success', pending: 'warning', rejected: 'error' };

const columns: ColumnsType<PurchaseRequest> = [
  { title: 'Department', dataIndex: 'department_name', render: (v: string | null, r) => v ?? `Dept #${r.department_id}` },
  { title: 'Status', dataIndex: 'status', width: 120, render: (v: string) => <StatusBadge label={v} tone={statusTone[v] ?? 'default'} /> },
  { title: 'Description', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
  { title: 'Date', dataIndex: 'created_at', width: 160 },
];

export function PurchaseRequestsPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const [status, setStatus] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = usePurchaseRequests({ status, per_page: pageSize, page });
  const itemsQuery = useWarehouseItems({ per_page: 0 });
  const categoriesQuery = useItemCategories({ per_page: 0 });
  const subCategoriesQuery = useItemSubCategories({ per_page: 0 });
  const itemOptions = useMemo(() => (itemsQuery.data?.data ?? []).map((i) => ({ label: i.name, value: i.id })), [itemsQuery.data]);
  const categoryOptions = useMemo(() => (categoriesQuery.data?.data ?? []).map((c) => ({ label: c.name, value: c.id })), [categoriesQuery.data]);
  const subCategoryOptions = useMemo(() => (subCategoriesQuery.data?.data ?? []).map((s) => ({ label: s.name, value: s.id })), [subCategoriesQuery.data]);

  const [departmentId, setDepartmentId] = useState<number>();
  const [categoryId, setCategoryId] = useState<number>();
  const [subCategoryId, setSubCategoryId] = useState<number>();
  const [itemId, setItemId] = useState<number>();
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const resetForm = () => {
    setDepartmentId(undefined);
    setCategoryId(undefined);
    setSubCategoryId(undefined);
    setItemId(undefined);
    setQuantity(1);
    setDescription('');
    setRemarks('');
  };

  const onSubmit = () => {
    if (!departmentId || !categoryId || !itemId) {
      message.error('Department, category, and item are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        '/procurement/purchase-requests',
        {
          department_id: departmentId,
          warehouse_item_category_id: categoryId,
          warehouse_item_sub_category_id: subCategoryId,
          description: description || undefined,
          remarks: remarks || undefined,
          items: [{ item_id: itemId, quantity }],
        },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Purchase request submitted.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to submit purchase request.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requests"
        breadcrumbs={[{ label: 'Procurement' }, { label: 'Purchase Requests' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            New Purchase Request
          </Button>
        }
      />

      <DataTable<PurchaseRequest>
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
        onRowClick={(record) => navigate(`/procurement/purchase-requests/${record.id}`)}
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
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No purchase requests found"
      />

      <FormModal title="Submit Purchase Request" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Department ID *</label>
          <InputNumber style={{ width: '100%' }} value={departmentId} onChange={(v) => setDepartmentId(v ?? undefined)} min={1} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item Category *</label>
          <Select style={{ width: '100%' }} options={categoryOptions} value={categoryId} onChange={setCategoryId} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item Sub-Category</label>
          <Select allowClear style={{ width: '100%' }} options={subCategoryOptions} value={subCategoryId} onChange={setSubCategoryId} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Item *</label>
          <Select style={{ width: '100%' }} options={itemOptions} value={itemId} onChange={setItemId} showSearch optionFilterProp="label" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity *</label>
          <InputNumber style={{ width: '100%' }} value={quantity} onChange={(v) => setQuantity(v ?? 1)} min={1} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Remarks</label>
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
      </FormModal>
    </PageContainer>
  );
}
