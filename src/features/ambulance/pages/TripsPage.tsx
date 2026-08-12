import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, InputNumber, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, CornerDownLeft } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useTrips, useReturnTrip } from '../hooks/useTrips';
import { isPaginated } from '@/types/api';
import type { Trip, TripStatus } from '../types/ambulance.types';

function ReturnTripModal({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { message } = useFeedback();
  const [closingReading, setClosingReading] = useState<number>();
  const returnTrip = useReturnTrip();

  const onSubmit = () => {
    if (closingReading === undefined) {
      message.error('Enter the closing reading.');
      return;
    }
    returnTrip.mutate(
      { id: trip.id, payload: { closing_reading: closingReading } },
      {
        onSuccess: () => {
          message.success('Trip returned.');
          onClose();
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to record trip return.')),
      },
    );
  };

  return (
    <Modal title={`Return Trip — ${trip.vehicle_registration_number}`} open onCancel={onClose} onOk={onSubmit} confirmLoading={returnTrip.isPending} okText="Return">
      <p style={{ color: '#4d5c6b', fontSize: 13 }}>Opening reading: {trip.opening_reading}</p>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Closing Reading</label>
      <InputNumber style={{ width: '100%' }} value={closingReading} onChange={(v) => setClosingReading(v ?? undefined)} min={(trip.opening_reading ?? 0) + 1} />
    </Modal>
  );
}

const columns: ColumnsType<Trip> = [
  { title: 'Patient', dataIndex: 'patient_name', render: (v: string | null, r) => v ?? `#${r.patient_id}` },
  { title: 'Destination', dataIndex: 'destination_hospital_name' },
  { title: 'Type', dataIndex: 'ambulance_type', width: 100, render: (v: string) => (v === 'in_house' ? 'In-house' : 'External') },
  {
    title: 'Vehicle/Driver',
    key: 'vehicle',
    render: (_, r) => (r.ambulance_type === 'in_house' ? `${r.vehicle_registration_number ?? '—'} / ${r.driver_name ?? '—'}` : `${r.external_vehicle_number ?? '—'} / ${r.external_driver_name ?? '—'}`),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    width: 120,
    render: (v: TripStatus) => <StatusBadge label={v === 'dispatched' ? 'Dispatched' : 'Returned'} tone={v === 'dispatched' ? 'warning' : 'success'} />,
  },
  { title: 'Requested', dataIndex: 'requested_at', width: 160 },
];

export function TripsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TripStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [returnTarget, setReturnTarget] = useState<Trip | null>(null);

  const query = useTrips({ status, per_page: pageSize, page });
  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const tableColumns: ColumnsType<Trip> = [
    ...columns,
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status === 'dispatched' && record.ambulance_type === 'in_house' ? (
          <Button size="small" icon={<CornerDownLeft size={14} />} onClick={() => setReturnTarget(record)}>
            Return
          </Button>
        ) : null,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Ambulance Trips"
        breadcrumbs={[{ label: 'Ambulance' }, { label: 'Trips' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/ambulance/trips/dispatch')}>
            Dispatch Ambulance
          </Button>
        }
      />

      <DataTable<Trip>
        columns={tableColumns}
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
        onRowClick={(record) => navigate(`/ambulance/trips/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 150 }}
              value={status}
              onChange={setStatus}
              options={[
                { label: 'Dispatched', value: 'dispatched' },
                { label: 'Returned', value: 'returned' },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No trips found"
      />

      {returnTarget && <ReturnTripModal trip={returnTarget} onClose={() => setReturnTarget(null)} />}
    </PageContainer>
  );
}
