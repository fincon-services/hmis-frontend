import { useState } from 'react';
import { InputNumber, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { apiClient } from '@/api/client';
import { isPaginated } from '@/types/api';
import type { PaginatedResponse, CollectionResponse } from '@/types/api';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string | null;
  punch_in_raw_at: string | null;
  punch_in_note: string | null;
  punch_in_at: string | null;
  punch_out_raw_at: string | null;
  punch_out_note: string | null;
  punch_out_at: string | null;
  state: string;
  is_adjusted: boolean;
  is_late: boolean;
  is_early_departure: boolean;
}

const SCREEN = 'attendance.records';

function useAttendanceRecords(params: { employee_id?: number; date?: string; per_page: number; page: number }) {
  return useQuery({
    queryKey: ['attendance-records', params],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<AttendanceRecord> | CollectionResponse<AttendanceRecord>>('/attendance/records', { params, screenKey: SCREEN })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}

const columns: ColumnsType<AttendanceRecord> = [
  { title: 'Employee', key: 'employee', render: (_, r) => r.employee_name ?? `#${r.employee_id}` },
  { title: 'Punch In', dataIndex: 'punch_in_at', render: (v: string | null) => v ?? '—' },
  { title: 'Punch Out', dataIndex: 'punch_out_at', render: (v: string | null) => v ?? '—' },
  { title: 'State', dataIndex: 'state', width: 110 },
  {
    title: 'Flags',
    key: 'flags',
    width: 180,
    render: (_, r) => (
      <>
        {r.is_late && <StatusBadge label="Late" tone="warning" />} {r.is_early_departure && <StatusBadge label="Early Departure" tone="warning" />}{' '}
        {r.is_adjusted && <StatusBadge label="Adjusted" tone="info" />}
      </>
    ),
  },
];

export function AttendanceRecordsPage() {
  const [employeeId, setEmployeeId] = useState<number>();
  const [date, setDate] = useState<Dayjs | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const query = useAttendanceRecords({ employee_id: employeeId, date: date?.format('YYYY-MM-DD'), per_page: pageSize, page });
  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  return (
    <PageContainer>
      <PageHeader title="Attendance Records" breadcrumbs={[{ label: 'HR' }, { label: 'Attendance' }, { label: 'Records' }]} />

      <DataTable<AttendanceRecord>
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
        toolbarLeft={
          <FilterBar>
            <InputNumber placeholder="Employee ID" value={employeeId} onChange={(v) => setEmployeeId(v ?? undefined)} min={1} />
            <DatePicker placeholder="Date" value={date} onChange={setDate} />
          </FilterBar>
        }
        emptyTitle="No attendance records found"
      />
    </PageContainer>
  );
}
