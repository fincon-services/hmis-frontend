import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Input, Select, List, Modal, InputNumber } from 'antd';
import { TestTube, Upload as UploadIcon, Download } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FileUpload } from '@/components/common/FileUpload';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useRadiologyTests } from './RadiologyTestsPage';
import { useRadiologyForVisit, usePrescribeRadiologyTests, useSaveRadiologyResult } from '../hooks/useRadiology';
import { radiologyWorkflowApi } from '../api/radiologyApi';
import type { Patient } from '@/features/patients/types/patient.types';
import type { PatientRadiologyPrescription } from '../types/radiology.types';

interface LocationState {
  patient?: Patient;
}

function UploadResultModal({ prescription, opdVisitId, onClose }: { prescription: PatientRadiologyPrescription; opdVisitId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const [description, setDescription] = useState('');
  const [viewNumber, setViewNumber] = useState(0);
  const saveResult = useSaveRadiologyResult(opdVisitId);

  return (
    <Modal title={`Upload Result — ${prescription.radiology_test_name}`} open onCancel={onClose} footer={null}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AP view" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>View Number</label>
        <InputNumber value={viewNumber} onChange={(v) => setViewNumber(v ?? 0)} min={0} style={{ width: '100%' }} />
      </div>
      <FileUpload
        buttonLabel="Upload Result"
        onUpload={(file, onProgress) =>
          new Promise<void>((resolve) => {
            saveResult.mutate(
              { prescriptionId: prescription.id, file, description: description || undefined, viewNumber, onProgress },
              {
                onSuccess: () => {
                  message.success('Result uploaded.');
                  onClose();
                  resolve();
                },
                onError: (error) => {
                  message.error(getErrorMessage(error, 'Unable to upload result.'));
                  resolve();
                },
              },
            );
          })
        }
      />
    </Modal>
  );
}

export function RadiologyVisitPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const testsQuery = useRadiologyTests({ is_active: true, per_page: 0 });
  const prescriptionsQuery = useRadiologyForVisit(visitId);
  const prescribeTests = usePrescribeRadiologyTests(visitId);

  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [prescribedBy, setPrescribedBy] = useState('MO');
  const [uploadTarget, setUploadTarget] = useState<PatientRadiologyPrescription | null>(null);

  const testOptions = useMemo(() => (testsQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [testsQuery.data]);

  const onPrescribe = () => {
    if (selectedTests.length === 0) {
      message.error('Select at least one test.');
      return;
    }
    prescribeTests.mutate(
      { radiology_test_ids: selectedTests, prescribed_by: prescribedBy },
      {
        onSuccess: () => {
          message.success('Radiology tests prescribed.');
          setSelectedTests([]);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to prescribe radiology tests.')),
      },
    );
  };

  const onDownload = (resultId: number, fileName: string) => {
    radiologyWorkflowApi.download(resultId, fileName).catch((error) => message.error(getErrorMessage(error, 'Unable to download result.')));
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Radiology — ${state.patient.name}` : 'Radiology'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Radiology', path: '/radiology/queue' }, { label: 'Visit' }]}
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
          <EmptyState title="No radiology tests prescribed yet" />
        ) : (
          <List
            dataSource={prescriptionsQuery.data}
            renderItem={(p) => (
              <List.Item actions={[
                <Button key="upload" size="small" type="primary" icon={<UploadIcon size={14} />} onClick={() => setUploadTarget(p)}>
                  Upload Result
                </Button>,
              ]}>
                <List.Item.Meta
                  title={
                    <span>
                      {p.radiology_test_name} {p.is_resulted && <StatusBadge label="Resulted" tone="success" />}
                    </span>
                  }
                  description={
                    <div>
                      <div>Prescribed by {p.prescribed_by}</div>
                      {p.results.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {p.results.map((r) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>
                                View {r.view_number}: {r.file_name} {r.description && `(${r.description})`}
                              </span>
                              <Button type="link" size="small" icon={<Download size={13} />} onClick={() => onDownload(r.id, r.file_name)}>
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      {uploadTarget && <UploadResultModal prescription={uploadTarget} opdVisitId={visitId} onClose={() => setUploadTarget(null)} />}
    </PageContainer>
  );
}
