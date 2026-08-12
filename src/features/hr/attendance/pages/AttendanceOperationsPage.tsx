import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Select, InputNumber, DatePicker, List, Input } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import type { CollectionResponse, MessageResponse } from '@/types/api';

const SCREEN_PULL = 'attendance.pull';
const SCREEN_ADJ = 'attendance.adjustments';

interface AdjustmentLog {
  id: number;
  employee_id: number;
  employee_name: string | null;
  adjusted_by: string | null;
  adjustment_reason: string;
  created_at: string;
}

function usePullMode() {
  return useQuery({
    queryKey: ['attendance-pull-mode'],
    queryFn: () => apiClient.get<{ pull_mode: string }>('/attendance/pull-settings', { screenKey: SCREEN_PULL }).then((r) => r.data.pull_mode),
  });
}

function useAdjustmentLogs() {
  return useQuery({
    queryKey: ['attendance-adjustment-logs'],
    queryFn: () => apiClient.get<CollectionResponse<AdjustmentLog>>('/attendance/adjustments/logs', { screenKey: SCREEN_ADJ }).then((r) => r.data.data),
  });
}

export function AttendanceOperationsPage() {
  const { message } = useFeedback();
  const pullModeQuery = usePullMode();
  const logsQuery = useAdjustmentLogs();

  const [newPullMode, setNewPullMode] = useState<string>();
  const [savingMode, setSavingMode] = useState(false);

  const [pullDeptId, setPullDeptId] = useState<number>();
  const [pullMonth, setPullMonth] = useState(new Date().getMonth() + 1);
  const [pullYear, setPullYear] = useState(new Date().getFullYear());
  const [pulling, setPulling] = useState(false);

  const [indivEmployeeId, setIndivEmployeeId] = useState<number>();
  const [indivMonth, setIndivMonth] = useState(new Date().getMonth() + 1);
  const [indivYear, setIndivYear] = useState(new Date().getFullYear());
  const [pullingIndiv, setPullingIndiv] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [adjEmployeeId, setAdjEmployeeId] = useState<number>();
  const [adjIn, setAdjIn] = useState('');
  const [adjOut, setAdjOut] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [absentDate, setAbsentDate] = useState<Dayjs | null>(dayjs());
  const [absentees, setAbsentees] = useState<{ employee_code: string; employee_name: string; department: string | null; job_title: string | null }[] | null>(null);
  const [loadingAbsent, setLoadingAbsent] = useState(false);

  const onSavePullMode = () => {
    if (!newPullMode) return;
    setSavingMode(true);
    apiClient
      .put('/attendance/pull-settings', { pull_mode: newPullMode }, { screenKey: SCREEN_PULL })
      .then(() => {
        message.success('Pull mode updated.');
        pullModeQuery.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to update pull mode.')))
      .finally(() => setSavingMode(false));
  };

  const onBulkPull = () => {
    if (!pullDeptId) {
      message.error('Department ID is required.');
      return;
    }
    setPulling(true);
    apiClient
      .post<MessageResponse>('/attendance/pull', { department_id: pullDeptId, month: pullMonth, year: pullYear }, { screenKey: SCREEN_PULL })
      .then((r) => message.success(r.data.message))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to pull department attendance.')))
      .finally(() => setPulling(false));
  };

  const onIndividualPull = () => {
    if (!indivEmployeeId) {
      message.error('Employee ID is required.');
      return;
    }
    setPullingIndiv(true);
    apiClient
      .post('/attendance/pull-individual', { employee_id: indivEmployeeId, month: indivMonth, year: indivYear }, { screenKey: SCREEN_PULL })
      .then(() => message.success('Attendance pulled.'))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to pull attendance.')))
      .finally(() => setPullingIndiv(false));
  };

  const onRefresh = () => {
    if (!indivEmployeeId) {
      message.error('Employee ID is required.');
      return;
    }
    setRefreshing(true);
    apiClient
      .post('/attendance/refresh', { employee_id: indivEmployeeId, month: indivMonth, year: indivYear }, { screenKey: SCREEN_PULL })
      .then(() => message.success('Records cleared for re-pull.'))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to clear records for re-pull.')))
      .finally(() => setRefreshing(false));
  };

  const onAdjust = () => {
    if (!adjEmployeeId || !adjIn || !adjOut || !adjReason) {
      message.error('All fields are required.');
      return;
    }
    setAdjusting(true);
    apiClient
      .post(
        '/attendance/adjustments',
        { employee_id: adjEmployeeId, punch_in_adjusted_at: adjIn, punch_out_adjusted_at: adjOut, adjustment_reason: adjReason },
        { screenKey: SCREEN_ADJ },
      )
      .then(() => {
        message.success('Attendance adjusted.');
        logsQuery.refetch();
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to adjust attendance.')))
      .finally(() => setAdjusting(false));
  };

  const onLookupAbsent = () => {
    if (!absentDate) return;
    setLoadingAbsent(true);
    apiClient
      .get<{ employee_code: string; employee_name: string; department: string | null; job_title: string | null }[]>('/attendance/absent', {
        params: { date: absentDate.format('YYYY-MM-DD') },
        screenKey: 'attendance.records',
      })
      .then((r) => setAbsentees(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to look up absentees.')))
      .finally(() => setLoadingAbsent(false));
  };

  return (
    <PageContainer>
      <PageHeader title="Attendance Operations" breadcrumbs={[{ label: 'HR' }, { label: 'Attendance' }, { label: 'Operations' }]} />

      <SectionCard title="Pull Mode">
        {pullModeQuery.isLoading ? (
          <LoadingState rows={1} />
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>Current mode: <strong>{pullModeQuery.data}</strong></span>
            <Select
              style={{ width: 160 }}
              placeholder="New mode"
              value={newPullMode}
              onChange={setNewPullMode}
              options={[
                { label: 'Disabled', value: 'disabled' },
                { label: 'Bulk', value: 'bulk' },
                { label: 'Individual', value: 'individual' },
              ]}
            />
            <Button type="primary" onClick={onSavePullMode} loading={savingMode}>
              Save
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Bulk Pull (by Department)">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <InputNumber placeholder="Department ID" value={pullDeptId} onChange={(v) => setPullDeptId(v ?? undefined)} min={1} />
          <InputNumber placeholder="Month" value={pullMonth} onChange={(v) => setPullMonth(v ?? 1)} min={1} max={12} />
          <InputNumber placeholder="Year" value={pullYear} onChange={(v) => setPullYear(v ?? pullYear)} min={2000} />
          <Button type="primary" onClick={onBulkPull} loading={pulling}>
            Pull
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Individual Pull / Refresh">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <InputNumber placeholder="Employee ID" value={indivEmployeeId} onChange={(v) => setIndivEmployeeId(v ?? undefined)} min={1} />
          <InputNumber placeholder="Month" value={indivMonth} onChange={(v) => setIndivMonth(v ?? 1)} min={1} max={12} />
          <InputNumber placeholder="Year" value={indivYear} onChange={(v) => setIndivYear(v ?? indivYear)} min={2000} />
          <Button onClick={onIndividualPull} loading={pullingIndiv}>
            Pull
          </Button>
          <Button danger onClick={onRefresh} loading={refreshing}>
            Refresh (Clear & Re-pull)
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Adjust Attendance">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <InputNumber placeholder="Employee ID" value={adjEmployeeId} onChange={(v) => setAdjEmployeeId(v ?? undefined)} min={1} />
          <Input placeholder="Punch In (YYYY-MM-DD HH:mm)" value={adjIn} onChange={(e) => setAdjIn(e.target.value)} style={{ width: 200 }} />
          <Input placeholder="Punch Out (YYYY-MM-DD HH:mm)" value={adjOut} onChange={(e) => setAdjOut(e.target.value)} style={{ width: 200 }} />
          <Input placeholder="Reason" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} style={{ width: 200 }} />
          <Button type="primary" onClick={onAdjust} loading={adjusting}>
            Adjust
          </Button>
        </div>

        {logsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (logsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No adjustment history" />
        ) : (
          <List
            dataSource={logsQuery.data}
            renderItem={(log) => (
              <List.Item>
                {log.employee_name ?? `#${log.employee_id}`} — {log.adjustment_reason} (by {log.adjusted_by ?? '—'}, {log.created_at})
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Absentees">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          <DatePicker value={absentDate} onChange={setAbsentDate} allowClear={false} />
          <Button type="primary" onClick={onLookupAbsent} loading={loadingAbsent}>
            Look Up
          </Button>
        </div>
        {absentees && (
          absentees.length === 0 ? (
            <EmptyState title="No absentees on this date" />
          ) : (
            <List
              dataSource={absentees}
              renderItem={(a) => (
                <List.Item>
                  {a.employee_name} ({a.employee_code}) — {a.department ?? '—'} · {a.job_title ?? '—'}
                </List.Item>
              )}
            />
          )
        )}
      </SectionCard>
    </PageContainer>
  );
}
