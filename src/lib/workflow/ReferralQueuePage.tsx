import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, DatePicker, Button, List } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader, type BreadcrumbItem } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { isPaginated } from '@/types/api';
import { usePatientQueue } from '@/features/patients/hooks/usePatientQueue';
import type { Origin, QueuedReferral } from '@/features/patients/types/patient.types';

export interface ReferralQueuePageConfig {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  description?: string;
  /** Fixed `referred_to` value this queue matches (e.g. "MO", "Lab", "Radiology", "Pharmacy"). */
  referredTo: string;
  actionLabel: string;
  actionIcon: LucideIcon;
  buildPath: (entry: QueuedReferral) => string;
  defaultOrigin?: Origin;
}

/** Shared queue UI for every module built on `/patients/queue` (Consultation, Laboratory, Radiology, Pharmacy, ...). */
export function ReferralQueuePage({ title, breadcrumbs, description, referredTo, actionLabel, actionIcon: ActionIcon, buildPath, defaultOrigin = 'OPD' }: ReferralQueuePageConfig) {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<Origin>(defaultOrigin);
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const query = usePatientQueue({
    origin,
    referred_to: referredTo,
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
      <PageHeader title={title} breadcrumbs={breadcrumbs} description={description} />

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
          title={debouncedSearch ? 'No patients found matching the selected criteria.' : 'No patients waiting'}
          description={debouncedSearch ? undefined : "Patients referred here will appear as soon as they're added to the queue."}
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
                <Button
                  key="action"
                  type="primary"
                  size="small"
                  icon={<ActionIcon size={14} />}
                  onClick={() => navigate(buildPath(entry), { state: { patient: entry.patient, referralId: entry.id } })}
                >
                  {actionLabel}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {entry.patient.name} <span style={{ color: '#4d5c6b', fontWeight: 400 }}>({entry.patient.mr_no})</span>{' '}
                    <StatusBadge label={entry.patient.origin} tone={entry.patient.origin === 'ER' ? 'error' : 'info'} />
                  </span>
                }
                description={`Referred by ${entry.referred_by} · ${entry.created_at}`}
              />
            </List.Item>
          )}
        />
      )}
    </PageContainer>
  );
}
