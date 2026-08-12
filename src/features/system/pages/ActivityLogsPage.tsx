import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, DatePicker, Input, Modal, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

const SCREEN = 'system.activity-logs';

interface ActivityLog {
  id: number;
  method: string;
  uri: string;
  request_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
  error_data: Record<string, unknown> | null;
  status_code: number;
  user_id: number | null;
  username: string | null;
  ip_address: string | null;
  logged_at: string;
}

function useActivityLogs(params: { date_from: string; date_to: string; keyword?: string; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<ActivityLog> | CollectionResponse<ActivityLog>>('/system/activity-logs', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

const methodTone: Record<string, string> = { GET: 'blue', POST: 'green', PUT: 'gold', PATCH: 'gold', DELETE: 'red' };

export function ActivityLogsPage() {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(1, 'day'), dayjs()]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detail, setDetail] = useState<ActivityLog | null>(null);

  const query = useActivityLogs({
    date_from: range[0].format('YYYY-MM-DD'),
    date_to: range[1].format('YYYY-MM-DD'),
    keyword: keyword || undefined,
    per_page: pageSize,
    page,
  });

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const columns: ColumnsType<ActivityLog> = [
    { title: 'Method', dataIndex: 'method', width: 90, render: (v: string) => <Tag color={methodTone[v] ?? 'default'}>{v}</Tag> },
    { title: 'URI', dataIndex: 'uri', ellipsis: true },
    { title: 'Status', dataIndex: 'status_code', width: 90, render: (v: number) => <StatusBadge label={String(v)} tone={v >= 400 ? 'error' : 'success'} /> },
    { title: 'User', dataIndex: 'username', width: 140, render: (v: string | null) => v ?? '—' },
    { title: 'IP Address', dataIndex: 'ip_address', width: 140, render: (v: string | null) => v ?? '—' },
    { title: 'Logged At', dataIndex: 'logged_at', width: 170 },
  ];

  return (
    <PageContainer>
      <PageHeader title="Activity Logs" breadcrumbs={[{ label: 'System' }, { label: 'Activity Logs' }]} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <DatePicker.RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} />
        <Input placeholder="Search URI, body, username, or IP" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 280 }} />
      </div>

      <DataTable<ActivityLog>
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
        onRowClick={(record) => setDetail(record)}
        emptyTitle="No activity logs found for this range"
      />

      <Modal title={`${detail?.method} ${detail?.uri}`} open={!!detail} onCancel={() => setDetail(null)} footer={<Button onClick={() => setDetail(null)}>Close</Button>} width={720}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0 }}>
              Status: <StatusBadge label={String(detail.status_code)} tone={detail.status_code >= 400 ? 'error' : 'success'} /> — User: {detail.username ?? '—'} — IP: {detail.ip_address ?? '—'} — {detail.logged_at}
            </p>
            <div>
              <strong>Request</strong>
              <pre style={{ background: '#f6f7f9', padding: 10, borderRadius: 6, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                {JSON.stringify(detail.request_data, null, 2) || '—'}
              </pre>
            </div>
            <div>
              <strong>Response</strong>
              <pre style={{ background: '#f6f7f9', padding: 10, borderRadius: 6, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                {JSON.stringify(detail.response_data, null, 2) || '—'}
              </pre>
            </div>
            {detail.error_data && (
              <div>
                <strong>Error</strong>
                <pre style={{ background: '#fbeceb', padding: 10, borderRadius: 6, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                  {JSON.stringify(detail.error_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
