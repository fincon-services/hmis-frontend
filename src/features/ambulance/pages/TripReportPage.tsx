import { useMemo, useState } from 'react';
import { Button, Select, DatePicker, List, Empty } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { useVehicles } from './VehiclesPage';
import { useTripReport } from '../hooks/useTrips';

export function TripReportPage() {
  const vehiclesQuery = useVehicles({ per_page: 0 });
  const [vehicleId, setVehicleId] = useState<number>();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()]);
  const report = useTripReport();

  const vehicleOptions = useMemo(() => (vehiclesQuery.data?.data ?? []).map((v) => ({ label: v.registration_number, value: v.id })), [vehiclesQuery.data]);

  const onRun = () => {
    report.mutate({ vehicle_id: vehicleId, date_from: range[0].format('YYYY-MM-DD'), date_to: range[1].format('YYYY-MM-DD') });
  };

  return (
    <PageContainer>
      <PageHeader title="Ambulance Trip Report" breadcrumbs={[{ label: 'Ambulance' }, { label: 'Report' }]} />

      <SectionCard title="Filters">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Vehicle</label>
            <Select allowClear style={{ width: 200 }} options={vehicleOptions} value={vehicleId} onChange={setVehicleId} placeholder="All vehicles" />
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
        <SectionCard title="Completed Trips">
          {report.data.length === 0 ? (
            <Empty description="No trips in this range" />
          ) : (
            <List
              dataSource={report.data}
              renderItem={(t) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${t.patient_name ?? `Patient #${t.patient_id}`} → ${t.destination_hospital_name}`}
                    description={`${t.vehicle_registration_number ?? t.external_vehicle_number} · Opening ${t.opening_reading} → Closing ${t.closing_reading} · ${t.requested_at}`}
                  />
                </List.Item>
              )}
            />
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
