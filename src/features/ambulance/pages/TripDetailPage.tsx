import { useParams } from 'react-router-dom';
import { Steps } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailCard } from '@/components/common/DetailCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useTrip } from '../hooks/useTrips';

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const id = Number(tripId);
  const query = useTrip(id);

  if (query.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (query.error || !query.data) {
    return (
      <PageContainer>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </PageContainer>
    );
  }

  const trip = query.data;

  return (
    <PageContainer>
      <PageHeader
        title={`Trip #${trip.id}`}
        breadcrumbs={[{ label: 'Ambulance' }, { label: 'Trips', path: '/ambulance/trips' }, { label: `#${trip.id}` }]}
        extra={<StatusBadge label={trip.status === 'dispatched' ? 'Dispatched' : 'Returned'} tone={trip.status === 'dispatched' ? 'warning' : 'success'} />}
      />

      <SectionCard title="Trip Progress">
        <Steps
          size="small"
          current={trip.status === 'returned' ? 1 : 0}
          items={[
            { title: 'Dispatched', description: trip.requested_at },
            { title: 'Returned', description: trip.status === 'returned' ? `Closing reading: ${trip.closing_reading}` : 'Awaiting return' },
          ]}
        />
      </SectionCard>

      <SectionCard title="Trip Details">
        <DetailCard
          fields={[
            { label: 'Patient', value: trip.patient_name ?? `#${trip.patient_id}` },
            { label: 'Destination', value: trip.destination_hospital_name },
            { label: 'Referred From', value: trip.referred_from_department.toUpperCase() },
            { label: 'Ward', value: trip.ward_name },
            { label: 'Doctor', value: trip.doctor_name },
            { label: 'Type', value: trip.ambulance_type === 'in_house' ? 'In-house' : 'External' },
            trip.ambulance_type === 'in_house'
              ? { label: 'Vehicle', value: trip.vehicle_registration_number }
              : { label: 'External Vehicle', value: trip.external_vehicle_number },
            trip.ambulance_type === 'in_house'
              ? { label: 'Driver', value: trip.driver_name }
              : { label: 'External Driver', value: trip.external_driver_name },
            { label: 'Opening Reading', value: trip.opening_reading },
            { label: 'Closing Reading', value: trip.closing_reading },
            { label: 'Requested At', value: trip.requested_at },
          ]}
        />
      </SectionCard>
    </PageContainer>
  );
}
