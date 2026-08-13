import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, List, Tabs, Space, Typography, Breadcrumb } from 'antd';
import { Pencil, CalendarPlus, Pill, BedDouble, Scissors } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailGrid } from '@/components/common/DetailGrid';
import { DetailItem } from '@/components/common/DetailItem';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { Can } from '@/app/guards/PermissionGuard';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { usePatient } from '../hooks/usePatient';
import { usePatientVisits } from '../hooks/usePatientVisits';
import { useUpdatePatient } from '../hooks/useUpdatePatient';
import { useRecordVisit } from '../hooks/useRecordVisit';
import { useVitalsForPatient } from '@/features/clinical/vitals/hooks/useVitals';
import { useConsultationsForPatient, useDiagnosesForPatient } from '@/features/clinical/consultation/hooks/useConsultation';
import { useLabPrescriptionsForPatient } from '@/features/clinical/laboratory/hooks/useLaboratory';
import { useRadiologyForPatient } from '@/features/clinical/radiology/hooks/useRadiology';
import { usePharmacyForPatient } from '@/features/clinical/pharmacy/hooks/usePharmacy';
import { usePatientAdmissions } from '@/features/clinical/ipd/hooks/useIpd';
import { useOtSchedulesForPatient, useOtSurgeriesForPatient } from '@/features/clinical/ot/hooks/useOt';
import { formatPatientAge, type Patient } from '../types/patient.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const nameRegex = /^[a-zA-Z ]+$/;
const phoneRegex = /^03\d{9}$/;
const cnicRegex = /^[1-9]\d{4}-\d{7}-\d{1}$/;

const editSchema = z.object({
  name: z.string().regex(nameRegex, 'Letters and spaces only').min(3).max(30),
  gender: z.enum(['male', 'female']),
  guardian_name: z.string().regex(nameRegex, 'Letters and spaces only').min(3).max(30),
  guardian_phone: z.string().regex(phoneRegex, 'Must be 11 digits starting with 03').optional().or(z.literal('')),
  guardian_cnic: z.string().regex(cnicRegex, 'Format: XXXXX-XXXXXXX-X').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  referred_from: z.string().max(200).optional().or(z.literal('')),
});
type EditFormValues = z.infer<typeof editSchema>;

const editFields: FieldConfig<EditFormValues>[] = [
  { type: 'text', name: 'name', label: 'Patient Name', required: true, span: 6 },
  {
    type: 'select',
    name: 'gender',
    label: 'Gender',
    required: true,
    span: 3,
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
    ],
  },
  { type: 'text', name: 'referred_from', label: 'Referred From', span: 3 },
  { type: 'text', name: 'guardian_name', label: 'Guardian Name', required: true, span: 4 },
  { type: 'text', name: 'guardian_phone', label: 'Guardian Phone', span: 4 },
  { type: 'text', name: 'guardian_cnic', label: 'Guardian CNIC', span: 4 },
  { type: 'textarea', name: 'address', label: 'Address', span: 12 },
];

const visitSchema = z.object({
  origin: z.enum(['OPD', 'ER'], { required_error: 'Origin is required' }),
});
type VisitFormValues = z.infer<typeof visitSchema>;

const visitFields: FieldConfig<VisitFormValues>[] = [
  {
    type: 'select',
    name: 'origin',
    label: 'Visit Origin',
    required: true,
    options: [
      { label: 'OPD', value: 'OPD' },
      { label: 'ER', value: 'ER' },
    ],
  },
];

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const navigate = useNavigate();
  const { message } = useFeedback();

  const patientQuery = usePatient(patientId);
  const updatePatient = useUpdatePatient(patientId);
  const recordVisit = useRecordVisit(patientId);

  const [editOpen, setEditOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  const editForm = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });
  const visitForm = useForm<VisitFormValues>({ resolver: zodResolver(visitSchema), defaultValues: { origin: 'OPD' } });

  if (patientQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (patientQuery.error || !patientQuery.data) {
    return (
      <PageContainer>
        <ErrorState error={patientQuery.error} onRetry={() => patientQuery.refetch()} />
      </PageContainer>
    );
  }

  const patient = patientQuery.data;

  const openEdit = () => {
    editForm.reset({
      name: patient.name,
      gender: patient.gender,
      guardian_name: patient.guardian_name,
      guardian_phone: patient.guardian_phone ?? '',
      guardian_cnic: patient.guardian_cnic ?? '',
      address: patient.address ?? '',
      referred_from: patient.referred_from ?? '',
    });
    setEditOpen(true);
  };

  const onEditSubmit = (values: EditFormValues) => {
    updatePatient.mutate(
      {
        ...values,
        guardian_phone: values.guardian_phone || undefined,
        guardian_cnic: values.guardian_cnic || undefined,
        address: values.address || undefined,
        referred_from: values.referred_from || undefined,
      },
      {
        onSuccess: () => {
          message.success('Patient demographics updated.');
          setEditOpen(false);
        },
        onError: (error) => {
          const handled = applyServerValidationErrors(error, editForm.setError);
          if (!handled) message.error(getErrorMessage(error, 'Unable to update patient demographics.'));
        },
      },
    );
  };

  const onVisitSubmit = (values: VisitFormValues) => {
    recordVisit.mutate(values, {
      onSuccess: () => {
        message.success('Visit recorded.');
        setVisitOpen(false);
      },
      onError: (error) => message.error(getErrorMessage(error, 'Unable to record visit.')),
    });
  };

  return (
    <PageContainer>
      <Breadcrumb
        style={{ marginBottom: 8 }}
        items={[{ title: <Link to="/patients">Patients</Link> }, { title: patient.mr_no }]}
      />

      <PatientIdentityBar
        patient={patient}
        onEdit={openEdit}
        onRecordVisit={() => setVisitOpen(true)}
      />

      <Tabs
        items={[
          { key: 'overview', label: 'Overview', children: <OverviewTab patient={patient} /> },
          { key: 'visits', label: 'Visits', children: <VisitsTab patientId={patientId} patient={patient} navigate={navigate} /> },
          { key: 'vitals', label: 'Vitals', children: <VitalsTab patientId={patientId} /> },
          { key: 'consultation', label: 'Consultation', children: <ConsultationTab patientId={patientId} /> },
          { key: 'laboratory', label: 'Laboratory', children: <LaboratoryTab patientId={patientId} /> },
          { key: 'radiology', label: 'Radiology', children: <RadiologyTab patientId={patientId} /> },
          { key: 'pharmacy', label: 'Pharmacy', children: <PharmacyTab patientId={patientId} /> },
          { key: 'ipd', label: 'IPD', children: <IpdTab patientId={patientId} /> },
          { key: 'ot', label: 'OT', children: <OtTab patientId={patientId} /> },
        ]}
      />

      <FormModal
        title="Edit Demographics"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onSubmit={editForm.handleSubmit(onEditSubmit)}
        confirmLoading={updatePatient.isPending}
        size="lg"
      >
        <GeneratedForm fields={editFields} control={editForm.control} errors={editForm.formState.errors} />
      </FormModal>

      <FormModal
        title="Record Follow-up Visit"
        open={visitOpen}
        onCancel={() => setVisitOpen(false)}
        onSubmit={visitForm.handleSubmit(onVisitSubmit)}
        confirmLoading={recordVisit.isPending}
        width={420}
      >
        <GeneratedForm fields={visitFields} control={visitForm.control} errors={visitForm.formState.errors} />
      </FormModal>
    </PageContainer>
  );
}

/** Persistent patient-identity band — always visible above the tabs so the answer to "which patient am I working with?" never scrolls away. */
function PatientIdentityBar({ patient, onEdit, onRecordVisit }: { patient: Patient; onEdit: () => void; onRecordVisit: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '16px 20px',
        marginBottom: 16,
        background: '#fff',
        border: '1px solid #d7dde3',
        borderRadius: 8,
      }}
    >
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {patient.name}
        </Typography.Title>
        <Space size={10} wrap style={{ marginTop: 4, color: '#4d5c6b', fontSize: 13 }}>
          <span>MR# {patient.mr_no}</span>
          <span>·</span>
          <span>{patient.gender === 'male' ? 'Male' : 'Female'}</span>
          <span>·</span>
          <span>{formatPatientAge(patient.age)}</span>
          <StatusBadge label={patient.origin} tone={patient.origin === 'ER' ? 'error' : 'info'} />
        </Space>
      </div>
      <Space>
        <Can screen="patients.registration">
          <Button icon={<CalendarPlus size={15} />} onClick={onRecordVisit}>
            Record Visit
          </Button>
        </Can>
        <Can screen="patients.registration">
          <Button type="primary" icon={<Pencil size={15} />} onClick={onEdit}>
            Edit Demographics
          </Button>
        </Can>
      </Space>
    </div>
  );
}

function OverviewTab({ patient }: { patient: Patient }) {
  return (
    <SectionCard title="Demographics">
      <DetailGrid>
        <DetailItem label="MR Number" value={patient.mr_no} />
        <DetailItem label="Name" value={patient.name} />
        <DetailItem label="Gender" value={patient.gender === 'male' ? 'Male' : 'Female'} />
        <DetailItem label="Age" value={formatPatientAge(patient.age)} />
        <DetailItem label="Date of Birth" value={patient.date_of_birth} />
        <DetailItem label="Origin" value={<StatusBadge label={patient.origin} tone={patient.origin === 'ER' ? 'error' : 'info'} />} />
        <DetailItem label="Guardian Name" value={patient.guardian_name} />
        <DetailItem label="Guardian Phone" value={patient.guardian_phone} />
        <DetailItem label="Guardian CNIC" value={patient.guardian_cnic} />
        <DetailItem label="Referred From" value={patient.referred_from} />
        <DetailItem label="Registration Date" value={patient.registration_date} />
        <DetailItem label="Address" value={patient.address} span={6} />
      </DetailGrid>
    </SectionCard>
  );
}

function VisitsTab({ patientId, patient, navigate }: { patientId: number; patient: Patient; navigate: ReturnType<typeof useNavigate> }) {
  const visitsQuery = usePatientVisits(patientId);

  if (visitsQuery.isLoading) return <LoadingState rows={3} />;
  if ((visitsQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No visits recorded yet" description="Visits recorded for this patient will appear here." />;
  }

  return (
    <List
      dataSource={visitsQuery.data}
      renderItem={(visit) => (
        <List.Item
          actions={[
            <Button key="prescribe" size="small" icon={<Pill size={14} />} onClick={() => navigate(`/pharmacy/prescribe/${visit.id}`, { state: { patient } })}>
              Prescribe Medicine
            </Button>,
            <Button key="admit" size="small" icon={<BedDouble size={14} />} onClick={() => navigate(`/ipd/admit/${visit.id}`, { state: { patient } })}>
              Admit to Ward
            </Button>,
            <Button key="ot" size="small" icon={<Scissors size={14} />} onClick={() => navigate(`/ot/visit/${visit.id}`, { state: { patient } })}>
              OT
            </Button>,
          ]}
        >
          <List.Item.Meta
            title={
              <Space size={8}>
                <StatusBadge label={visit.origin} tone={visit.origin === 'ER' ? 'error' : 'info'} />
                {visit.visit_date}
              </Space>
            }
            description={visit.is_follow_up ? 'Follow-up visit' : 'Initial visit'}
          />
        </List.Item>
      )}
    />
  );
}

function VitalsTab({ patientId }: { patientId: number }) {
  const vitalsQuery = useVitalsForPatient(patientId);

  if (vitalsQuery.isLoading) return <LoadingState rows={3} />;
  if ((vitalsQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No vitals recorded yet" description="Vitals recorded across this patient's visits will appear here." />;
  }

  return (
    <List
      dataSource={vitalsQuery.data}
      renderItem={(v) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space size={8}>
                {v.vital_type_name ?? `Type #${v.vital_type_id}`}
                <StatusBadge label={String(v.value)} tone="default" />
              </Space>
            }
            description={v.created_at}
          />
        </List.Item>
      )}
    />
  );
}

function ConsultationTab({ patientId }: { patientId: number }) {
  const consultationsQuery = useConsultationsForPatient(patientId);
  const diagnosesQuery = useDiagnosesForPatient(patientId);

  return (
    <>
      <SectionCard title="Consultations">
        {consultationsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (consultationsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No consultation notes yet" />
        ) : (
          <List
            dataSource={consultationsQuery.data}
            renderItem={(note) => (
              <List.Item>
                <List.Item.Meta title={`${note.prescribed_by} · ${note.created_at}`} description={note.complains || note.medical_history || note.prescription || '—'} />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Diagnoses">
        {diagnosesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (diagnosesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No diagnoses recorded yet" />
        ) : (
          <List
            dataSource={diagnosesQuery.data}
            renderItem={(d) => (
              <List.Item>
                <Space size={8}>
                  <StatusBadge label={d.diagnosis_type} tone={d.diagnosis_type === 'final' ? 'success' : 'warning'} />
                  {d.diagnosis_type_name ?? `Type #${d.diagnosis_type_id}`}
                  <span style={{ color: '#4d5c6b' }}>{d.created_at}</span>
                </Space>
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </>
  );
}

function LaboratoryTab({ patientId }: { patientId: number }) {
  const labQuery = useLabPrescriptionsForPatient(patientId);

  if (labQuery.isLoading) return <LoadingState rows={2} />;
  if ((labQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No lab tests prescribed yet" />;
  }

  return (
    <List
      dataSource={labQuery.data}
      renderItem={(p) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space size={8}>
                {p.lab_test_name}
                <StatusBadge label={p.specimen_status} />
              </Space>
            }
            description={`Prescribed by ${p.prescribed_by} · ${p.created_at}`}
          />
        </List.Item>
      )}
    />
  );
}

function RadiologyTab({ patientId }: { patientId: number }) {
  const radiologyQuery = useRadiologyForPatient(patientId);

  if (radiologyQuery.isLoading) return <LoadingState rows={2} />;
  if ((radiologyQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No radiology tests prescribed yet" />;
  }

  return (
    <List
      dataSource={radiologyQuery.data}
      renderItem={(p) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space size={8}>
                {p.radiology_test_name}
                {p.is_resulted && <StatusBadge label="Resulted" tone="success" />}
              </Space>
            }
            description={`Prescribed by ${p.prescribed_by} · ${p.created_at}`}
          />
        </List.Item>
      )}
    />
  );
}

function PharmacyTab({ patientId }: { patientId: number }) {
  const pharmacyQuery = usePharmacyForPatient(patientId);

  if (pharmacyQuery.isLoading) return <LoadingState rows={2} />;
  if ((pharmacyQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No medicines prescribed yet" />;
  }

  return (
    <List
      dataSource={pharmacyQuery.data}
      renderItem={(p) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space size={8}>
                {p.medicine_name} × {p.quantity}
                <StatusBadge label={p.is_dispensed ? 'Dispensed' : 'Pending'} tone={p.is_dispensed ? 'success' : 'warning'} />
              </Space>
            }
            description={`Prescribed by ${p.prescribed_by} · ${p.created_at}`}
          />
        </List.Item>
      )}
    />
  );
}

function IpdTab({ patientId }: { patientId: number }) {
  const admissionsQuery = usePatientAdmissions(patientId);

  if (admissionsQuery.isLoading) return <LoadingState rows={2} />;
  if ((admissionsQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No ward admissions yet" />;
  }

  return (
    <List
      dataSource={admissionsQuery.data}
      renderItem={(a) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space size={8}>
                {a.ward_name} — Bed {a.bed_no}
                <StatusBadge label={a.is_discharged ? 'Discharged' : 'Active'} tone={a.is_discharged ? 'default' : 'success'} />
              </Space>
            }
            description={`Admitted ${a.admitted_at}`}
          />
        </List.Item>
      )}
    />
  );
}

function OtTab({ patientId }: { patientId: number }) {
  const otSchedulesQuery = useOtSchedulesForPatient(patientId);
  const otSurgeriesQuery = useOtSurgeriesForPatient(patientId);

  if (otSchedulesQuery.isLoading || otSurgeriesQuery.isLoading) return <LoadingState rows={2} />;
  if ((otSchedulesQuery.data?.length ?? 0) === 0 && (otSurgeriesQuery.data?.length ?? 0) === 0) {
    return <EmptyState title="No OT activity yet" />;
  }

  return (
    <SectionCard title="OT History">
      {(otSchedulesQuery.data?.length ?? 0) > 0 && (
        <List
          size="small"
          header="Scheduled"
          dataSource={otSchedulesQuery.data}
          renderItem={(s) => (
            <List.Item>
              <Space size={8}>
                {s.ot_procedure_name} — {s.scheduled_date}
                {s.is_referred && <StatusBadge label="Referred" tone="info" />}
              </Space>
            </List.Item>
          )}
        />
      )}
      {(otSurgeriesQuery.data?.length ?? 0) > 0 && (
        <List
          size="small"
          header="Performed"
          dataSource={otSurgeriesQuery.data}
          renderItem={(s) => (
            <List.Item>
              {s.ot_procedure_name} — {s.anesthesia_type}
            </List.Item>
          )}
        />
      )}
    </SectionCard>
  );
}
