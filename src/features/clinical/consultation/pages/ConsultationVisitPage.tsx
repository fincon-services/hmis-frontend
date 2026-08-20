import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, Select, Radio, List, Typography, Input, Tooltip } from 'antd';
import { TestTube, Radiation } from 'lucide-react';
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
import { useLabTests } from '../../laboratory/pages/LabTestsPage';
import { useLabPrescriptionsForVisit, usePrescribeLabTests } from '../../laboratory/hooks/useLaboratory';
import { useRadiologyTests } from '../../radiology/pages/RadiologyTestsPage';
import { useRadiologyForVisit, usePrescribeRadiologyTests } from '../../radiology/hooks/useRadiology';
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

/** Lab/Radiology now have their own dedicated referral path below (prescribe-first) — kept out of this generic list so it can't be used to bypass that requirement. */
const REFER_TARGETS = ['Pharmacy', 'IPD', 'Discharged'];

const HISTORY_REQUIRED_MESSAGE = 'Please save the consultation history before continuing.';

/** Wraps a disabled action in the standard antd pattern (a disabled button suppresses pointer events, so the Tooltip needs a non-disabled span wrapper to still fire on hover). */
function GatedAction({ gated, children }: { gated: boolean; children: ReactNode }) {
  if (!gated) return <>{children}</>;
  return (
    <Tooltip title={HISTORY_REQUIRED_MESSAGE}>
      <span>{children}</span>
    </Tooltip>
  );
}

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

  const labTestsQuery = useLabTests({ is_active: true, per_page: 0 });
  const labPrescriptionsQuery = useLabPrescriptionsForVisit(visitId);
  const prescribeLabTests = usePrescribeLabTests(visitId);

  const radiologyTestsQuery = useRadiologyTests({ is_active: true, per_page: 0 });
  const radiologyPrescriptionsQuery = useRadiologyForVisit(visitId);
  const prescribeRadiologyTests = usePrescribeRadiologyTests(visitId);

  /** Real server truth (not just "was Save clicked this session") — correct on first load of a visit that already has history, and updates immediately after a successful save since the mutation invalidates this query. */
  const hasHistory = (notesQuery.data?.length ?? 0) > 0;

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

  const [selectedLabTests, setSelectedLabTests] = useState<number[]>([]);
  const [labPrescribedBy, setLabPrescribedBy] = useState('MO');
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState<number[]>([]);
  const [radiologyPrescribedBy, setRadiologyPrescribedBy] = useState('MO');

  const diagnosisOptions = useMemo(
    () => (diagnosisTypesQuery.data?.data ?? []).map((d) => ({ label: d.name, value: d.id })),
    [diagnosisTypesQuery.data],
  );
  const labTestOptions = useMemo(() => (labTestsQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [labTestsQuery.data]);
  const radiologyTestOptions = useMemo(() => (radiologyTestsQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [radiologyTestsQuery.data]);

  const hasLabPrescription = (labPrescriptionsQuery.data?.length ?? 0) > 0;
  const hasRadiologyPrescription = (radiologyPrescriptionsQuery.data?.length ?? 0) > 0;

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
          message.success('Consultation history saved successfully.');
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

  const onPrescribeLabTests = () => {
    if (selectedLabTests.length === 0) {
      message.error('Please select at least one laboratory test.');
      return;
    }
    prescribeLabTests.mutate(
      { lab_test_ids: selectedLabTests, prescribed_by: labPrescribedBy },
      {
        onSuccess: (result) => {
          message.success(`${result.created.length} test(s) prescribed.${result.already_prescribed.length ? ` Already pending: ${result.already_prescribed.join(', ')}.` : ''}`);
          setSelectedLabTests([]);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to prescribe lab tests.')),
      },
    );
  };

  const onSendToLaboratory = () => {
    // Prescribing already files the referral atomically (LabTestPrescriptionService::prescribe), so
    // there is no separate "send" API call to make here — this only closes out the doctor's workflow.
    message.success('Patient sent to Laboratory.');
    navigate('/consultation/queue');
  };

  const onPrescribeRadiologyTests = () => {
    if (selectedRadiologyTests.length === 0) {
      message.error('Please select at least one radiology test.');
      return;
    }
    prescribeRadiologyTests.mutate(
      { radiology_test_ids: selectedRadiologyTests, prescribed_by: radiologyPrescribedBy },
      {
        onSuccess: () => {
          message.success('Test(s) prescribed.');
          setSelectedRadiologyTests([]);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to prescribe radiology tests.')),
      },
    );
  };

  const onSendToRadiology = () => {
    // Same as Laboratory — RadiologyPrescriptionService::prescribe already files the referral.
    message.success('Patient sent to Radiology.');
    navigate('/consultation/queue');
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
          <GatedAction gated={!hasHistory}>
            <Select
              value={referTarget}
              onChange={setReferTarget}
              style={{ width: 160 }}
              disabled={!hasHistory}
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
          </GatedAction>
        }
      />

      <SectionCard title="Consultation History">
        <form onSubmit={handleSubmit(onSubmitConsultation)} noValidate style={{ maxWidth: 560 }}>
          <GeneratedForm fields={consultationFields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={recordConsultation.isPending}>
            Save History
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
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                options={diagnosisOptions}
                value={selectedDiagnoses}
                onChange={setSelectedDiagnoses}
                placeholder="Select diagnoses"
                disabled={!hasHistory}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Classification</label>
              <Radio.Group value={diagnosisClass} onChange={(e) => setDiagnosisClass(e.target.value)} disabled={!hasHistory}>
                <Radio value="provisional">Provisional</Radio>
                <Radio value="final">Final</Radio>
              </Radio.Group>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Diagnosed By</label>
              <Input value={diagnosedBy} onChange={(e) => setDiagnosedBy(e.target.value)} placeholder="MO" disabled={!hasHistory} />
            </div>
            <GatedAction gated={!hasHistory}>
              <Button type="primary" onClick={onSubmitDiagnoses} loading={recordDiagnoses.isPending} disabled={!hasHistory}>
                Add Diagnosis
              </Button>
            </GatedAction>
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

      <SectionCard title="Laboratory">
        {labTestsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (
          <div style={{ maxWidth: 560, marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Tests</label>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                options={labTestOptions}
                value={selectedLabTests}
                onChange={setSelectedLabTests}
                placeholder="Search and select tests"
                disabled={!hasHistory}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Prescribed By</label>
              <Input value={labPrescribedBy} onChange={(e) => setLabPrescribedBy(e.target.value)} placeholder="MO" disabled={!hasHistory} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <GatedAction gated={!hasHistory}>
                <Button type="primary" icon={<TestTube size={15} />} onClick={onPrescribeLabTests} loading={prescribeLabTests.isPending} disabled={!hasHistory}>
                  Save Prescription
                </Button>
              </GatedAction>
              <Button onClick={onSendToLaboratory} disabled={!hasLabPrescription}>
                Send to Laboratory
              </Button>
            </div>
          </div>
        )}

        {labPrescriptionsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (labPrescriptionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No lab tests prescribed yet" />
        ) : (
          <List
            dataSource={labPrescriptionsQuery.data}
            renderItem={(p) => (
              <List.Item>
                <List.Item.Meta title={p.lab_test_name} description={`Prescribed by ${p.prescribed_by}`} />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Radiology">
        {radiologyTestsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (
          <div style={{ maxWidth: 560, marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Tests</label>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                options={radiologyTestOptions}
                value={selectedRadiologyTests}
                onChange={setSelectedRadiologyTests}
                placeholder="Search and select tests"
                disabled={!hasHistory}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Prescribed By</label>
              <Input value={radiologyPrescribedBy} onChange={(e) => setRadiologyPrescribedBy(e.target.value)} placeholder="MO" disabled={!hasHistory} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <GatedAction gated={!hasHistory}>
                <Button type="primary" icon={<Radiation size={15} />} onClick={onPrescribeRadiologyTests} loading={prescribeRadiologyTests.isPending} disabled={!hasHistory}>
                  Save Prescription
                </Button>
              </GatedAction>
              <Button onClick={onSendToRadiology} disabled={!hasRadiologyPrescription}>
                Send to Radiology
              </Button>
            </div>
          </div>
        )}

        {radiologyPrescriptionsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (radiologyPrescriptionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No radiology tests prescribed yet" />
        ) : (
          <List
            dataSource={radiologyPrescriptionsQuery.data}
            renderItem={(p) => (
              <List.Item>
                <List.Item.Meta title={p.radiology_test_name} description={`Prescribed by ${p.prescribed_by}`} />
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
