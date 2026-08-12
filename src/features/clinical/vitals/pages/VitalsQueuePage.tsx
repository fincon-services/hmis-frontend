import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, DatePicker, Button, List } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Activity } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useVitalsQueue } from '../hooks/useVitals';
import type { Origin } from '@/features/patients/types/patient.types';

export function VitalsQueuePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState<Origin>('OPD');
  const [date, setDate] = useState<Dayjs>(dayjs());

  const query = useVitalsQueue(origin, date.format('YYYY-MM-DD'));

  return (
    <PageContainer>
      <PageHeader title="Vitals Queue" breadcrumbs={[{ label: 'Clinical' }, { label: 'Vitals' }, { label: 'Queue' }]} description="Visits still awaiting a round of vitals." />

      <FilterBar>
        <Select
          value={origin}
          onChange={setOrigin}
          style={{ width: 130 }}
          options={[
            { label: 'OPD', value: 'OPD' },
            { label: 'ER', value: 'ER' },
          ]}
        />
        <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} />
      </FilterBar>

      {query.isLoading ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="No patients waiting for vitals" description="Visits that still need a round of vitals will appear here." />
      ) : (
        <List
          dataSource={query.data}
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
