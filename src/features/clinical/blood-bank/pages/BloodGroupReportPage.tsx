import { useState } from 'react';
import { Button, Select, DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useBloodGroupReport } from '../hooks/useBloodBank';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function BloodGroupReportPage() {
  const { message } = useFeedback();
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()]);
  const report = useBloodGroupReport();

  const onRun = () => {
    report.mutate(
      { bloodGroup, dateFrom: range[0].format('YYYY-MM-DD'), dateTo: range[1].format('YYYY-MM-DD') },
      { onError: (error) => message.error(getErrorMessage(error, 'Unable to generate blood group report.')) },
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Blood Group Report" breadcrumbs={[{ label: 'Clinical' }, { label: 'Blood Bank' }, { label: 'Report' }]} />

      <SectionCard title="Filters">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Blood Group</label>
            <Select value={bloodGroup} onChange={setBloodGroup} style={{ width: 120 }} options={BLOOD_GROUPS.map((g) => ({ label: g, value: g }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date Range</label>
            <DatePicker.RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} allowClear={false} />
          </div>
          <Button type="primary" onClick={onRun} loading={report.isPending}>
            Run Report
          </Button>
        </div>
      </SectionCard>

      {report.data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <StatCard label="Total Bags" value={report.data.total_bags} />
          <StatCard label="Total Quantity" value={report.data.total_quantity} />
          <StatCard label="Issued" value={report.data.issued_quantity} />
          <StatCard label="Remaining" value={report.data.remaining_quantity} />
          <StatCard label="Expired" value={report.data.expired_quantity} />
        </div>
      )}
    </PageContainer>
  );
}
