import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Switch, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, ListOrdered } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActionMenu } from '@/components/common/ActionMenu';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'approval.processes';

interface ApprovalStep {
  id: number;
  role_id: number;
  role_name: string | null;
  step_order: number;
}

export interface ApprovalProcess {
  id: number;
  name: string;
  request_type: string;
  is_active: boolean;
  steps: ApprovalStep[];
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

function useApprovalProcesses(params: { request_type?: string; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['approval-processes', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<ApprovalProcess> | CollectionResponse<ApprovalProcess>>('/approval/processes', { params, screenKey: SCREEN })
        .then((r) => r.data),
  });
}

function useRoles() {
  return useQuery({
    queryKey: ['acl-roles'],
    queryFn: () => apiClient.get<CollectionResponse<Role>>('/acl/roles', { screenKey: SCREEN }).then((r) => r.data.data),
  });
}

export function ApprovalProcessesPage() {
  const { message } = useFeedback();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [stepsTarget, setStepsTarget] = useState<ApprovalProcess | null>(null);

  const query = useApprovalProcesses({ per_page: pageSize, page });
  const rolesQuery = useRoles();
  const roleOptions = useMemo(() => (rolesQuery.data ?? []).map((r) => ({ label: r.name, value: r.id })), [rolesQuery.data]);

  const [name, setName] = useState('');
  const [requestType, setRequestType] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const resetForm = () => {
    setName('');
    setRequestType('');
    setIsActive(true);
    setRoleIds([]);
  };

  const onSubmit = () => {
    if (!name || !requestType || roleIds.length === 0) {
      message.error('Name, request type, and at least one approver role are required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .post('/approval/processes', { name, request_type: requestType, is_active: isActive, role_ids: roleIds }, { screenKey: SCREEN })
      .then(() => {
        message.success('Approval process created.');
        setModalOpen(false);
        resetForm();
        query.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to create approval process.')))
      .finally(() => setSubmitting(false));
  };

  const columns: ColumnsType<ApprovalProcess> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Request Type', dataIndex: 'request_type', width: 200 },
    { title: 'Status', dataIndex: 'is_active', width: 110, render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={v ? 'success' : 'default'} /> },
    {
      title: 'Approval Chain',
      key: 'steps',
      render: (_, r) => (
        <>
          {[...r.steps]
            .sort((a, b) => a.step_order - b.step_order)
            .map((s) => (
              <Tag key={s.id}>
                {s.step_order}. {s.role_name ?? `Role #${s.role_id}`}
              </Tag>
            ))}
        </>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, record) => (
        <ActionMenu items={[{ key: 'steps', label: 'Manage Steps', icon: <ListOrdered size={14} />, onClick: () => setStepsTarget(record) }]} />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Approval Processes"
        breadcrumbs={[{ label: 'Approval' }, { label: 'Processes' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
            New Process
          </Button>
        }
      />

      <DataTable<ApprovalProcess>
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
        emptyTitle="No approval processes found"
      />

      <FormModal title="Create Approval Process" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={onSubmit} confirmLoading={submitting}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leave Application Approval" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Request Type *</label>
          <Input value={requestType} onChange={(e) => setRequestType(e.target.value)} placeholder="e.g. leave_application" />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>A free-text key the requesting module will use to start this chain.</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Approver Roles, in order *</label>
          <Select mode="multiple" style={{ width: '100%' }} options={roleOptions} value={roleIds} onChange={setRoleIds} placeholder="Select roles in approval order" />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>Roles approve in the order selected — first selected approves first.</p>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
            <Switch checked={isActive} onChange={setIsActive} /> Active
          </label>
        </div>
      </FormModal>

      {stepsTarget && <ManageStepsModal process={stepsTarget} roleOptions={roleOptions} onClose={() => setStepsTarget(null)} onSaved={() => query.refetch()} />}
    </PageContainer>
  );
}

function ManageStepsModal({
  process,
  roleOptions,
  onClose,
  onSaved,
}: {
  process: ApprovalProcess;
  roleOptions: { label: string; value: number }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = useFeedback();
  const [roleIds, setRoleIds] = useState<number[]>([...process.steps].sort((a, b) => a.step_order - b.step_order).map((s) => s.role_id));
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    if (roleIds.length === 0) {
      message.error('At least one approver role is required.');
      return;
    }
    setSubmitting(true);
    apiClient
      .put(`/approval/processes/${process.id}/steps`, { role_ids: roleIds }, { screenKey: SCREEN })
      .then(() => {
        message.success('Approval chain updated.');
        onSaved();
        onClose();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to update approval chain.')))
      .finally(() => setSubmitting(false));
  };

  return (
    <FormModal title={`Manage Steps — ${process.name}`} open onCancel={onClose} onSubmit={onSubmit} confirmLoading={submitting}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Approver Roles, in order *</label>
      <Select mode="multiple" style={{ width: '100%' }} options={roleOptions} value={roleIds} onChange={setRoleIds} placeholder="Select roles in approval order" />
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        Saving replaces the entire chain with these roles, in the order selected.
      </p>
    </FormModal>
  );
}
