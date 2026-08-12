import { Link } from 'react-router-dom';
import { Button, List, Tag } from 'antd';
import { PackageCheck } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { usePendingDispense, useDispensePrescription } from '../hooks/usePharmacy';

export function PendingDispensePage() {
  const query = usePendingDispense();
  const dispense = useDispensePrescription();
  const confirm = useConfirm();
  const { message } = useFeedback();

  const onDispense = (id: number, medicineName: string | null) => {
    confirm({
      title: `Dispense "${medicineName ?? 'this medicine'}"?`,
      content: 'This deducts stock (if linked to a warehouse item) and cannot be undone.',
      okText: 'Dispense',
      onConfirm: () =>
        dispense.mutate(id, {
          onSuccess: () => message.success('Prescription dispensed.'),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to dispense prescription.')),
        }),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Pending Dispense"
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Pharmacy' }, { label: 'Pending Dispense' }]}
        description="Prescriptions awaiting dispensing, oldest first."
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState title="Nothing pending dispensing" />
      ) : (
        <List
          dataSource={query.data}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Button key="dispense" type="primary" size="small" icon={<PackageCheck size={14} />} onClick={() => onDispense(p.id, p.medicine_name)}>
                  Dispense
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    {p.medicine_name} × {p.quantity} <Tag>{p.times_a_day}x/day for {p.no_of_days} days</Tag>
                  </span>
                }
                description={
                  <span>
                    <Link to={`/patients/${p.patient_id}`}>View Patient #{p.patient_id}</Link> · Prescribed by {p.prescribed_by}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </PageContainer>
  );
}
