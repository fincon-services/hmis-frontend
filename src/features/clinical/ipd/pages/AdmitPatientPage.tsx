import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, Select, InputNumber } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useWards } from './WardsPage';
import { useWardBeds, useAdmitPatient } from '../hooks/useIpd';
import type { Patient } from '@/features/patients/types/patient.types';

interface LocationState {
  patient?: Patient;
}

export function AdmitPatientPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const wardsQuery = useWards({ per_page: 0 });
  const [wardId, setWardId] = useState<number | undefined>();
  const bedsQuery = useWardBeds(wardId ?? 0);
  const [bedId, setBedId] = useState<number | undefined>();
  const [doctorUserId, setDoctorUserId] = useState<number | undefined>();
  const admit = useAdmitPatient(visitId);

  const wardOptions = useMemo(() => (wardsQuery.data?.data ?? []).map((w) => ({ label: `${w.name} (${w.occupied_beds ?? 0}/${w.total_beds})`, value: w.id })), [wardsQuery.data]);
  const bedOptions = useMemo(() => (bedsQuery.data ?? []).filter((b) => !b.is_occupied).map((b) => ({ label: b.bed_no, value: b.id })), [bedsQuery.data]);

  const onSubmit = () => {
    if (!wardId || !bedId) {
      message.error('Select a ward and bed.');
      return;
    }
    admit.mutate(
      { ward_id: wardId, bed_id: bedId, doctor_user_id: doctorUserId },
      {
        onSuccess: () => {
          message.success('Patient admitted.');
          navigate(state.patient ? `/patients/${state.patient.id}` : '/ipd/wards');
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to admit patient.')),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Admit to Ward — ${state.patient.name}` : 'Admit to Ward'}
        breadcrumbs={[{ label: 'Patients', path: '/patients' }, { label: 'Admit to Ward' }]}
        description={state.patient ? `MR# ${state.patient.mr_no}` : undefined}
        extra={<Button onClick={() => navigate(-1)}>Back</Button>}
      />

      <SectionCard title="Admission Details">
        <div style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              Ward <span style={{ color: '#b3261e' }}>*</span>
            </label>
            <Select style={{ width: '100%' }} options={wardOptions} value={wardId} onChange={(v) => { setWardId(v); setBedId(undefined); }} placeholder="Select ward" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              Bed <span style={{ color: '#b3261e' }}>*</span>
            </label>
            <Select style={{ width: '100%' }} options={bedOptions} value={bedId} onChange={setBedId} disabled={!wardId} placeholder={wardId ? 'Select a free bed' : 'Select a ward first'} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Doctor User ID</label>
            <InputNumber style={{ width: '100%' }} value={doctorUserId} onChange={(v) => setDoctorUserId(v ?? undefined)} min={1} />
          </div>
          <Button type="primary" onClick={onSubmit} loading={admit.isPending}>
            Admit Patient
          </Button>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
