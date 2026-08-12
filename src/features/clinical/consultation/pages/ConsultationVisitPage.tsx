import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, Select, Radio, List, Typography, Input } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useDiagnosisTypes } from './DiagnosisTypesPage';
import { useConsultationsForVisit, useDiagnosesForVisit, useRecordConsultation, useRecordDiagnoses } from '../hooks/useConsultation';
import { useReferPatient } from '@/features/patients/hooks/usePatientQueue';
import { formatPatientAge, type Patient } from '@/features/patients/types/patient.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type { DiagnosisClass } from '../types/consultation.types';

interface LocationState {
  patient?: Patient;
}

const consultationSchema = z
  .object({
    medical_history: z.string().max(2000).optional().or(z.literal('')),
    complains: z.string().max(2000).optional().or(z.literal('')),
    prescription: z.string().max(2000).optional().or(z.literal('')),
    prescribed_by: z.string().min(1, 'Required').max(50),
  })
  .refine((d) => d.medical_history || d.complains || d.prescription, {
    message: 'Enter at least one of medical history, complains, or prescription',
    path: ['complains'],
  });
type ConsultationFormValues = z.infer<typeof consultationSchema>;

const consultationFields: FieldConfig<ConsultationFormValues>[] = [
  { type: 'textarea', name: 'medical_history', label: 'Medical History' },
  { type: 'textarea', name: 'complains', label: 'Complains' },
  { type: 'textarea', name: 'prescription', label: 'Prescription' },
  { type: 'text', name: 'prescribed_by', label: 'Prescribed By', required: true, placeholder: 'MO' },
];

const REFER_TARGETS = ['Lab', 'Radiology', 'Pharmacy', 'IPD', 'Discharged'];

export function ConsultationVisitPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const notesQuery = useConsultationsForVisit(visitId);
  const diagnosesQuery = useDiagnosesForVisit(visitId);
  const diagnosisTypesQuery = useDiagnosisTypes({ is_active: true, per_page: 0 });
  const recordConsultation = useRecordConsultation(visitId, state.patient?.id ?? 0);
  const recordDiagnoses = useRecordDiagnoses(visitId, state.patient?.id ?? 0);
  const referPatient = useReferPatient(visitId);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationFormValues>({ resolver: zodResolver(consultationSchema), defaultValues: { prescribed_by: 'MO' } });

  const [selectedDiagnoses, setSelectedDiagnoses] = useState<number[]>([]);
  const [diagnosisClass, setDiagnosisClass] = useState<DiagnosisClass>('provisional');
  const [diagnosedBy, setDiagnosedBy] = useState('MO');
  const [referTarget, setReferTarget] = useState<string>('Pharmacy');

  const diagnosisOptions = useMemo(
    () => (diagnosisTypesQuery.data?.data ?? []).map((d) => ({ label: d.name, value: d.id })),
    [diagnosisTypesQuery.data],
  );

  const onSubmitConsultation = (values: ConsultationFormValues) => {
    recordConsultation.mutate(
      {
        medical_history: values.medical_history || undefined,
        complains: values.complains || undefined,
        prescription: values.prescription || undefined,
        prescribed_by: values.prescribed_by,
      },
      {
        onSuccess: () => {
          message.success('Consultation note recorded.');
          reset({ prescribed_by: values.prescribed_by });
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to record consultation note.')),
      },
    );
  };

  const onSubmitDiagnoses = () => {
    if (selectedDiagnoses.length === 0) {
      message.error('Select at least one diagnosis.');
      return;
    }
    recordDiagnoses.mutate(
      { diagnosis_type_ids: selectedDiagnoses, diagnosis_type: diagnosisClass, diagnosed_by: diagnosedBy },
      {
        onSuccess: () => {
          message.success('Diagnoses recorded.');
          setSelectedDiagnoses([]);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to record diagnoses.')),
      },
    );
  };

  const onRefer = () => {
    referPatient.mutate(
      { referred_by: 'MO', referred_to: referTarget },
      {
        onSuccess: () => {
          message.success(`Patient referred to ${referTarget}.`);
          navigate('/consultation/queue');
        },
        onError: (error) => message.error(getErrorMessage(error, `Unable to refer patient to ${referTarget}.`)),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Consultation — ${state.patient.name}` : 'Consultation'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Consultation', path: '/consultation/queue' }, { label: 'Visit' }]}
        description={state.patient ? `MR# ${state.patient.mr_no} · ${state.patient.gender === 'male' ? 'Male' : 'Female'} · ${formatPatientAge(state.patient.age)}` : undefined}
        extra={
          <Select
            value={referTarget}
            onChange={setReferTarget}
            style={{ width: 160 }}
            options={REFER_TARGETS.map((t) => ({ label: t, value: t }))}
            popupRender={(menu) => (
              <div>
                {menu}
                <div style={{ padding: 8, borderTop: '1px solid #d7dde3' }}>
                  <Button type="primary" size="small" block loading={referPatient.isPending} onClick={onRefer}>
                    Refer Patient
                  </Button>
                </div>
              </div>
            )}
          />
        }
      />

      <SectionCard title="Consultation Note">
        <form onSubmit={handleSubmit(onSubmitConsultation)} noValidate style={{ maxWidth: 560 }}>
          <GeneratedForm fields={consultationFields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={recordConsultation.isPending}>
            Save Note
          </Button>
        </form>

        <Typography.Title level={5} style={{ marginTop: 24 }}>
          History
        </Typography.Title>
        {notesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (notesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No consultation notes yet" />
        ) : (
          <List
            dataSource={notesQuery.data}
            renderItem={(note) => (
              <List.Item>
                <List.Item.Meta
                  title={`${note.prescribed_by} · ${note.created_at}`}
                  description={
                    <div>
                      {note.complains && <div>Complains: {note.complains}</div>}
                      {note.medical_history && <div>History: {note.medical_history}</div>}
                      {note.prescription && <div>Prescription: {note.prescription}</div>}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Diagnoses">
        {diagnosisTypesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (
          <div style={{ maxWidth: 560, marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Diagnoses</label>
              <Select mode="multiple" style={{ width: '100%' }} options={diagnosisOptions} value={selectedDiagnoses} onChange={setSelectedDiagnoses} placeholder="Select diagnoses" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Classification</label>
              <Radio.Group value={diagnosisClass} onChange={(e) => setDiagnosisClass(e.target.value)}>
                <Radio value="provisional">Provisional</Radio>
                <Radio value="final">Final</Radio>
              </Radio.Group>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Diagnosed By</label>
              <Input value={diagnosedBy} onChange={(e) => setDiagnosedBy(e.target.value)} placeholder="MO" />
            </div>
            <Button type="primary" onClick={onSubmitDiagnoses} loading={recordDiagnoses.isPending}>
              Save Diagnoses
            </Button>
          </div>
        )}

        <Typography.Title level={5}>Recorded This Visit</Typography.Title>
        {diagnosesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (diagnosesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No diagnoses recorded yet" />
        ) : (
          <List
            dataSource={diagnosesQuery.data}
            renderItem={(d) => (
              <List.Item>
                <StatusBadge label={d.diagnosis_type} tone={d.diagnosis_type === 'final' ? 'success' : 'warning'} />
                {d.diagnosis_type_name ?? `Type #${d.diagnosis_type_id}`}
                <span style={{ color: '#4d5c6b', marginLeft: 8 }}>by {d.diagnosed_by}</span>
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
