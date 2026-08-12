import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Check, X } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';
import type { CollectionResponse } from '@/types/api';

const SCREEN = 'approval.requests';

export interface ApprovalRequest {
  id: number;
  approval_process_id: number;
  process_name: string | null;
  request_type: string;
  request_id: number;
  current_step_order: number;
  current_step_role_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_user_id: number | null;
  created_at: string;
}

const statusTone: Record<string, 'success' | 'warning' | 'error'> = { approved: 'success', pending: 'warning', rejected: 'error' };

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['approval-requests-pending'],
    queryFn: () => apiClient.get<CollectionResponse<ApprovalRequest>>('/approval/requests/pending', { screenKey: SCREEN }).then((r) => r.data.data),
  });
}

export function ApprovalRequestsQueuePage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = usePendingApprovals();
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const onDecide = (record: ApprovalRequest, approve: boolean) => {
    confirm({
      title: approve ? `Approve "${record.process_name ?? record.request_type}" #${record.request_id}?` : `Reject "${record.process_name ?? record.request_type}" #${record.request_id}?`,
      okText: approve ? 'Approve' : 'Reject',
      danger: !approve,
      onConfirm: () => {
        setDecidingId(record.id);
        apiClient
          .post(`/approval/requests/${record.id}/decision`, { approve }, { screenKey: SCREEN })
          .then(() => {
            message.success(approve ? `Request #${record.request_id} approved.` : `Request #${record.request_id} rejected.`);
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to record decision.')))
          .finally(() => setDecidingId(null));
      },
    });
  };

  const columns: ColumnsType<ApprovalRequest> = [
    { title: 'Process', dataIndex: 'process_name', render: (v: string | null, r) => v ?? `Process #${r.approval_process_id}` },
    { title: 'Request Type', dataIndex: 'request_type', width: 180 },
    { title: 'Request ID', dataIndex: 'request_id', width: 110 },
    { title: 'Step', dataIndex: 'current_step_order', width: 90 },
    { title: 'Status', dataIndex: 'status', width: 110, render: (v: string) => <StatusBadge label={v} tone={statusTone[v] ?? 'default'} /> },
    { title: 'Requested', dataIndex: 'created_at', width: 160 },
    {
      title: '',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button size="small" type="primary" icon={<Check size={14} />} loading={decidingId === record.id} onClick={() => onDecide(record, true)}>
            Approve
          </Button>
          <Button size="small" danger icon={<X size={14} />} loading={decidingId === record.id} onClick={() => onDecide(record, false)}>
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Approval Queue" breadcrumbs={[{ label: 'Approval' }, { label: 'Pending Queue' }]} />

      <DataTable<ApprovalRequest>
        columns={columns}
        data={query.data}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(record) => navigate(`/approval/requests/${record.id}`)}
        emptyTitle="No approvals awaiting your decision"
        emptyDescription="Requests assigned to your active role's approval step will appear here."
      />
    </PageContainer>
  );
}
