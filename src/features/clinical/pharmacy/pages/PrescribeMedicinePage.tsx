import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, List } from 'antd';
import { useMemo } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useMedicines } from './MedicinesPage';
import { usePharmacyForVisit, usePrescribeMedicines } from '../hooks/usePharmacy';
import type { Patient } from '@/features/patients/types/patient.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

interface LocationState {
  patient?: Patient;
}

const schema = z.object({
  medicine_id: z.number({ required_error: 'Medicine is required', invalid_type_error: 'Medicine is required' }),
  quantity: z.number({ required_error: 'Quantity is required' }).min(1),
  dose_level: z.number({ required_error: 'Dose level is required' }).min(0),
  times_a_day: z.number({ required_error: 'Required' }).min(1),
  no_of_days: z.string().min(1, 'Required').max(10),
  weightage_level: z.string().max(11).optional().or(z.literal('')),
  weightage_unit: z.string().max(10).optional().or(z.literal('')),
  table_spoons: z.string().max(11).optional().or(z.literal('')),
  prescribed_by: z.string().min(1, 'Required').max(20),
});
type FormValues = z.infer<typeof schema>;

export function PrescribeMedicinePage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const medicinesQuery = useMedicines({ is_active: true, per_page: 0 });
  const prescriptionsQuery = usePharmacyForVisit(visitId);
  const prescribe = usePrescribeMedicines(visitId);

  const medicineOptions = useMemo(() => (medicinesQuery.data?.data ?? []).map((m) => ({ label: m.name, value: m.id })), [medicinesQuery.data]);

  const fields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'medicine_id', label: 'Medicine', required: true, options: medicineOptions },
    { type: 'number', name: 'quantity', label: 'Quantity', required: true, min: 1 },
    { type: 'number', name: 'dose_level', label: 'Dose Level', required: true, min: 0 },
    { type: 'number', name: 'times_a_day', label: 'Times a Day', required: true, min: 1 },
    { type: 'text', name: 'no_of_days', label: 'Number of Days', required: true, placeholder: '5' },
    { type: 'text', name: 'weightage_level', label: 'Weight-based Level' },
    { type: 'text', name: 'weightage_unit', label: 'Weight-based Unit' },
    { type: 'text', name: 'table_spoons', label: 'Table Spoons' },
    { type: 'text', name: 'prescribed_by', label: 'Prescribed By', required: true, placeholder: 'MO' },
  ];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { prescribed_by: 'MO' } });

  const onSubmit = (values: FormValues) => {
    prescribe.mutate(
      {
        prescribed_by: values.prescribed_by,
        items: [
          {
            medicine_id: values.medicine_id,
            quantity: values.quantity,
            dose_level: values.dose_level,
            times_a_day: values.times_a_day,
            no_of_days: values.no_of_days,
            weightage_level: values.weightage_level || undefined,
            weightage_unit: values.weightage_unit || undefined,
            table_spoons: values.table_spoons || undefined,
          },
        ],
      },
      {
        onSuccess: () => {
          message.success('Medicine prescribed.');
          reset({ prescribed_by: values.prescribed_by });
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to prescribe medicine.')),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Prescribe Medicine — ${state.patient.name}` : 'Prescribe Medicine'}
        breadcrumbs={[{ label: 'Patients', path: '/patients' }, { label: 'Prescribe Medicine' }]}
        description={state.patient ? `MR# ${state.patient.mr_no}` : undefined}
        extra={<Button onClick={() => navigate(-1)}>Back</Button>}
      />

      <SectionCard title="New Prescription Item">
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
          <GeneratedForm fields={fields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={prescribe.isPending}>
            Add to Prescription
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Prescribed This Visit">
        {prescriptionsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (prescriptionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No medicines prescribed yet" />
        ) : (
          <List
            dataSource={prescriptionsQuery.data}
            renderItem={(p) => (
              <List.Item>
                <List.Item.Meta
                  title={`${p.medicine_name} × ${p.quantity}`}
                  description={`${p.times_a_day}x/day for ${p.no_of_days} days · ${p.is_dispensed ? 'Dispensed' : 'Pending dispense'}`}
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
