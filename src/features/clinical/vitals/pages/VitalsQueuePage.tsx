import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, DatePicker, Button, List } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Activity, RotateCcw } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { isPaginated } from '@/types/api';
import { useVitalsQueue } from '../hooks/useVitals';
import type { Origin } from '@/features/patients/types/patient.types';

export function VitalsQueuePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<Origin>('OPD');
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const query = useVitalsQueue({
    origin,
    date: date.format('YYYY-MM-DD'),
    search: debouncedSearch || undefined,
    page,
    per_page: pageSize,
  });

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const onReset = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader title="Vitals Queue" breadcrumbs={[{ label: 'Clinical' }, { label: 'Vitals' }, { label: 'Queue' }]} description="Visits still awaiting a round of vitals." />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, MR#, or guardian CNIC/phone…"
        />
        <Select
          value={origin}
          onChange={(v) => {
            setOrigin(v);
            setPage(1);
          }}
          style={{ width: 130 }}
          options={[
            { label: 'OPD', value: 'OPD' },
            { label: 'ER', value: 'ER' },
          ]}
        />
        <DatePicker
          value={date}
          onChange={(d) => {
            if (d) {
              setDate(d);
              setPage(1);
            }
          }}
          allowClear={false}
        />
        <Button icon={<RotateCcw size={14} />} onClick={onReset}>
          Reset
        </Button>
      </FilterBar>

      {query.isLoading ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (rows?.length ?? 0) === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No patients found matching the selected criteria.' : 'No patients waiting for vitals'}
          description={debouncedSearch ? undefined : 'Visits that still need a round of vitals will appear here.'}
        />
      ) : (
        <List
          dataSource={rows}
          pagination={
            meta
              ? {
                  current: meta.current_page,
                  pageSize: meta.per_page,
                  total: meta.total,
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  },
                  showSizeChanger: true,
                }
              : false
          }
          renderItem={(entry) => (
            <List.Item
              actions={[
                <Button key="record" type="primary" size="small" icon={<Activity size={14} />} onClick={() => navigate(`/vitals/record/${entry.opd_visit_id}`, { state: { patient: entry.patient, origin: entry.origin } })}>
                  Record Vitals
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {entry.patient.name} <span style={{ color: '#4d5c6b', fontWeight: 400 }}>({entry.patient.mr_no})</span>{' '}
                    <StatusBadge label={entry.origin} tone={entry.origin === 'ER' ? 'error' : 'info'} />
                    {entry.is_follow_up && <StatusBadge label="Follow-up" tone="default" />}
                  </span>
                }
                description={`Visit date: ${entry.visit_date}`}
              />
            </List.Item>
          )}
        />
      )}
    </PageContainer>
  );
}
