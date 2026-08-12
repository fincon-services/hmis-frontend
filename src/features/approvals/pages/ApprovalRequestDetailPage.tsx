import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, List, Space, Steps } from 'antd';
import { Check, X } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { getErrorMessage } from '@/utils/errors';

const SCREEN = 'approval.requests';
const PROCESS_SCREEN = 'approval.processes';

interface ApprovalDecision {
  id: number;
  approval_process_step_id: number;
  status: 'approved' | 'rejected';
  comments: string | null;
  decided_by_user_id: number | null;
  decided_at: string;
}

interface ApprovalRequestDetail {
  id: number;
  approval_process_id: number;
  process_name: string | null;
  request_type: string;
  request_id: number;
  current_step_order: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_user_id: number | null;
  decisions: ApprovalDecision[];
  created_at: string;
}

interface ApprovalProcessStep {
  id: number;
  role_id: number;
  role_name: string | null;
  step_order: number;
}

interface ApprovalProcessDetail {
  id: number;
  name: string;
  steps: ApprovalProcessStep[];
}

const statusTone: Record<string, 'success' | 'warning' | 'error'> = { approved: 'success', pending: 'warning', rejected: 'error' };

function useApprovalRequestDetail(id: number) {
  return useQuery({
    queryKey: ['approval-requests', 'detail', id],
    queryFn: () => apiClient.get<ApprovalRequestDetail>(`/approval/requests/${id}`, { screenKey: SCREEN }).then((r) => r.data),
    enabled: !!id,
  });
}

function useApprovalProcessDetail(processId: number) {
  return useQuery({
    queryKey: ['approval-processes', 'detail', processId],
    queryFn: () => apiClient.get<ApprovalProcessDetail>(`/approval/processes/${processId}`, { screenKey: PROCESS_SCREEN }).then((r) => r.data),
    enabled: !!processId,
  });
}

export function ApprovalRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const id = Number(requestId);
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useApprovalRequestDetail(id);
  const processQuery = useApprovalProcessDetail(query.data?.approval_process_id ?? 0);
  const [comments, setComments] = useState('');
  const [deciding, setDeciding] = useState(false);

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

  const request = query.data;
  const processSteps = [...(processQuery.data?.steps ?? [])].sort((a, b) => a.step_order - b.step_order);

  const stepItems = processSteps.map((step) => {
    const decision = request.decisions.find((d) => d.approval_process_step_id === step.id);
    const title = step.role_name ?? `Role #${step.role_id}`;

    if (decision) {
      return {
        title,
        status: decision.status === 'approved' ? ('finish' as const) : ('error' as const),
        description: `${decision.status === 'approved' ? 'Approved' : 'Rejected'} · ${decision.decided_at}${decision.comments ? ` · "${decision.comments}"` : ''}`,
      };
    }
    if (request.status !== 'rejected' && step.step_order === request.current_step_order) {
      return { title, status: 'process' as const, description: 'Awaiting decision' };
    }
    return { title, status: 'wait' as const, description: request.status === 'rejected' ? 'Not reached — chain stopped' : undefined };
  });

  const onDecide = (approve: boolean) => {
    confirm({
      title: approve ? 'Approve this request?' : 'Reject this request?',
      okText: approve ? 'Approve' : 'Reject',
      danger: !approve,
      onConfirm: () => {
        setDeciding(true);
        apiClient
          .post(`/approval/requests/${id}/decision`, { approve, comments: comments || undefined }, { screenKey: SCREEN })
          .then(() => {
            message.success(approve ? `Approval request #${id} approved.` : `Approval request #${id} rejected.`);
            setComments('');
            query.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to record decision.')))
          .finally(() => setDeciding(false));
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${request.process_name ?? request.request_type} — #${request.request_id}`}
        breadcrumbs={[{ label: 'Approval' }, { label: 'Pending Queue', path: '/approval/requests' }, { label: `#${request.id}` }]}
        extra={<StatusBadge label={request.status} tone={statusTone[request.status] ?? 'default'} />}
      />

      <SectionCard title="Request Details">
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Request Type: {request.request_type}</p>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>Underlying Record ID: {request.request_id}</p>
      </SectionCard>

      <SectionCard title="Approval Chain">
        {processQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : stepItems.length === 0 ? (
          <EmptyState title="No approval chain configured for this process" />
        ) : (
          <Steps size="small" items={stepItems} />
        )}
      </SectionCard>

      <SectionCard title="Decision History">
        {request.decisions.length === 0 ? (
          <EmptyState title="No decisions recorded yet" />
        ) : (
          <List
            dataSource={request.decisions}
            renderItem={(d) => (
              <List.Item>
                <StatusBadge label={d.status} tone={d.status === 'approved' ? 'success' : 'error'} /> &nbsp;
                {d.comments ?? 'No comments'} — {d.decided_at}
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      {request.status === 'pending' && (
        <SectionCard title="Your Decision">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Comments</label>
            <Input.TextArea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>
          <Space>
            <Button type="primary" icon={<Check size={14} />} loading={deciding} onClick={() => onDecide(true)}>
              Approve
            </Button>
            <Button danger icon={<X size={14} />} loading={deciding} onClick={() => onDecide(false)}>
              Reject
            </Button>
          </Space>
        </SectionCard>
      )}
    </PageContainer>
  );
}
