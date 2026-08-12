import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Input, DatePicker, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, CheckCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActionMenu } from '@/components/common/ActionMenu';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'finance.setup';

export interface FiscalYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

function useFiscalYears(params: { per_page: number; page: number }) {
  return useQuery({
    queryKey: ['finance-fiscal-years', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<FiscalYear> | CollectionResponse<FiscalYear>>('/finance/fiscal-years', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

export function useFiscalYearsList(params: { per_page: number }) {
  return useQuery({
    queryKey: ['finance-fiscal-years-plain', params],
    queryFn: () => apiClient.get<CollectionResponse<FiscalYear>>('/finance/fiscal-years', { params, screenKey: SCREEN }).then((r) => r.data),
  });
}

export function FiscalYearsPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const query = useFiscalYears({ per_page: pageSize, page });

  const [name, setName] = useState('');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const resetForm = () => {
    setName('');
    setRange(null);
    setIsActive(false);
  };

  const onSubmit = () => {
    if (!name || !range) {
      message.error('Name and date range are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post(
        '/finance/fiscal-years',
        { name, start_date: range[0].format('YYYY-MM-DD'), end_date: range[1].format('YYYY-MM-DD'), is_active: isActive },
        { screenKey: SCREEN },
      )
      .then(() => {
        message.success('Fiscal year created.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to create fiscal year.')))
      .finally(() => setSubmitting(false));
  };

  const onActivate = (fy: FiscalYear) => {
    confirm({
      title: `Make "${fy.name}" the active fiscal year?`,
      onConfirm: () => {
        setActivatingId(fy.id);
        apiClient
          .post(`/finance/fiscal-years/${fy.id}/activate`, {}, { screenKey: SCREEN })
          .then(() => {
            message.success('Fiscal year activated.');
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to activate fiscal year.')))
          .finally(() => setActivatingId(null));
      },
    });
  };

  const columns: ColumnsType<FiscalYear> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Start Date', dataIndex: 'start_date', width: 140 },
    { title: 'End Date', dataIndex: 'end_date', width: 140 },
    { title: 'Status', dataIndex: 'is_active', width: 110, render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={v ? 'success' : 'default'} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, record) =>
        !record.is_active ? (
          <ActionMenu items={[{ key: 'activate', label: 'Activate', icon: <CheckCircle size={14} />, onClick: () => onActivate(record) }]} />
        ) : null,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Fiscal Years"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Fiscal Years' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)} loading={activatingId !== null}>
            New Fiscal Year
          </Button>
        }
      />

      <DataTable<FiscalYear>
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
        emptyTitle="No fiscal years found"
      />

      <FormModal title="Create Fiscal Year" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-2027" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date Range *</label>
          <DatePicker.RangePicker style={{ width: '100%' }} value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
            <Switch checked={isActive} onChange={setIsActive} /> Set as active fiscal year
          </label>
        </div>
      </FormModal>
    </PageContainer>
  );
}
