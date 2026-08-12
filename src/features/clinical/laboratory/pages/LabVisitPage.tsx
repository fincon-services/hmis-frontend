import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Select, Input, List, Modal } from 'antd';
import { FlaskConical, TestTube, Beaker } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useLabTests } from './LabTestsPage';
import { useLabTestParameters } from '../hooks/useLabTestParameters';
import { useLabPrescriptionsForVisit, usePrescribeLabTests, useRecordSpecimen, useSaveLabResults } from '../hooks/useLaboratory';
import type { Patient } from '@/features/patients/types/patient.types';
import type { PatientLabTestPrescription, SpecimenStatus } from '../types/laboratory.types';

interface LocationState {
  patient?: Patient;
}

const STATUS_TONE: Record<SpecimenStatus, 'default' | 'warning' | 'success'> = {
  pending: 'default',
  received: 'warning',
  result: 'success',
};

function SpecimenModal({ prescription, opdVisitId, onClose }: { prescription: PatientLabTestPrescription; opdVisitId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const [specimenNo, setSpecimenNo] = useState('');
  const recordSpecimen = useRecordSpecimen(opdVisitId);

  return (
    <Modal
      title={`Record Specimen — ${prescription.lab_test_name}`}
      open
      onCancel={onClose}
      onOk={() =>
        recordSpecimen.mutate(
          { prescriptionId: prescription.id, payload: { specimen_no: specimenNo } },
          {
            onSuccess: () => {
              message.success('Specimen recorded.');
              onClose();
            },
            onError: (error) => message.error(getErrorMessage(error, 'Unable to record specimen.')),
          },
        )
      }
      confirmLoading={recordSpecimen.isPending}
      okText="Save"
    >
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Specimen Number</label>
      <Input value={specimenNo} onChange={(e) => setSpecimenNo(e.target.value)} placeholder="VTBC-00123" />
    </Modal>
  );
}

function ResultModal({ prescription, opdVisitId, onClose }: { prescription: PatientLabTestPrescription; opdVisitId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const parametersQuery = useLabTestParameters(prescription.lab_test_id);
  const saveResults = useSaveLabResults(opdVisitId);

  const [status, setStatus] = useState<SpecimenStatus>('result');
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<Record<number, string>>({});

  const onSave = () => {
    saveResults.mutate(
      {
        results: [
          {
            prescription_id: prescription.id,
            specimen_status: status,
            result_notes: notes || undefined,
            values: Object.entries(values)
              .filter(([, v]) => v.trim() !== '')
              .map(([parameter_id, value]) => ({ parameter_id: Number(parameter_id), value })),
          },
        ],
      },
      {
        onSuccess: () => {
          message.success(`${prescription.lab_test_name} result saved.`);
          onClose();
        },
        onError: (error) => message.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <Modal title={`Enter Result — ${prescription.lab_test_name}`} open onCancel={onClose} onOk={onSave} confirmLoading={saveResults.isPending} okText="Save Result" width={560}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Specimen Status</label>
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: '100%' }}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Received', value: 'received' },
            { label: 'Resulted', value: 'result' },
          ]}
        />
      </div>

      {parametersQuery.isLoading ? (
        <LoadingState rows={2} />
      ) : (parametersQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="No parameters defined for this test" />
      ) : (
        parametersQuery.data?.map((param) => (
          <div key={param.id} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
              {param.parameter_display_name} {param.parameter_value && <span style={{ color: '#4d5c6b', fontWeight: 400 }}>(ref: {param.parameter_value})</span>}
            </label>
            <Input
              value={values[param.id] ?? param.fixed_val ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [param.id]: e.target.value }))}
            />
          </div>
        ))
      )}

      <div style={{ marginTop: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Result Notes</label>
        <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
    </Modal>
  );
}

export function LabVisitPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const testsQuery = useLabTests({ is_active: true, per_page: 0 });
  const prescriptionsQuery = useLabPrescriptionsForVisit(visitId);
  const prescribeTests = usePrescribeLabTests(visitId);

  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [prescribedBy, setPrescribedBy] = useState('MO');
  const [specimenTarget, setSpecimenTarget] = useState<PatientLabTestPrescription | null>(null);
  const [resultTarget, setResultTarget] = useState<PatientLabTestPrescription | null>(null);

  const testOptions = useMemo(() => (testsQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [testsQuery.data]);

  const onPrescribe = () => {
    if (selectedTests.length === 0) {
      message.error('Select at least one test.');
      return;
    }
    prescribeTests.mutate(
      { lab_test_ids: selectedTests, prescribed_by: prescribedBy },
      {
        onSuccess: (result) => {
          message.success(`${result.created.length} test(s) prescribed.${result.already_prescribed.length ? ` Already pending: ${result.already_prescribed.join(', ')}.` : ''}`);
          setSelectedTests([]);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to prescribe lab tests.')),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Laboratory — ${state.patient.name}` : 'Laboratory'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Laboratory', path: '/laboratory/queue' }, { label: 'Visit' }]}
        description={state.patient ? `MR# ${state.patient.mr_no}` : undefined}
      />

      <SectionCard title="Prescribe Tests">
        <div style={{ maxWidth: 520 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Tests</label>
            <Select mode="multiple" style={{ width: '100%' }} options={testOptions} value={selectedTests} onChange={setSelectedTests} placeholder="Select tests" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Prescribed By</label>
            <Input value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="MO" />
          </div>
          <Button type="primary" icon={<TestTube size={15} />} onClick={onPrescribe} loading={prescribeTests.isPending}>
            Prescribe
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Prescriptions This Visit">
        {prescriptionsQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : (prescriptionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No lab tests prescribed yet" />
        ) : (
          <List
            dataSource={prescriptionsQuery.data}
            renderItem={(p) => (
              <List.Item
                actions={[
                  <Button key="specimen" size="small" icon={<Beaker size={14} />} onClick={() => setSpecimenTarget(p)}>
                    Specimen
                  </Button>,
                  <Button key="result" size="small" type="primary" icon={<FlaskConical size={14} />} onClick={() => setResultTarget(p)}>
                    Result
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {p.lab_test_name} <StatusBadge label={p.specimen_status} tone={STATUS_TONE[p.specimen_status]} />
                    </span>
                  }
                  description={
                    <span>
                      {p.specimen_no && <>Specimen: {p.specimen_no} · </>}
                      Prescribed by {p.prescribed_by}
                      {p.is_resulted && <StatusBadge label="Resulted" tone="success" />}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      {specimenTarget && <SpecimenModal prescription={specimenTarget} opdVisitId={visitId} onClose={() => setSpecimenTarget(null)} />}
      {resultTarget && <ResultModal prescription={resultTarget} opdVisitId={visitId} onClose={() => setResultTarget(null)} />}
    </PageContainer>
  );
}
