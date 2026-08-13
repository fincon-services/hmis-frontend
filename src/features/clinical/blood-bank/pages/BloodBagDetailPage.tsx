import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input, Select, InputNumber, List, Modal } from 'antd';
import { Trash2, Send } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailGrid } from '@/components/common/DetailGrid';
import { DetailItem } from '@/components/common/DetailItem';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useLabTestParameters } from '@/features/clinical/laboratory/hooks/useLabTestParameters';
import {
  useBloodBag,
  useBloodIssues,
  useBloodDiscards,
  useSaveDonorScreening,
  useSaveScreeningResults,
  useIssueBlood,
  useDiscardBlood,
} from '../hooks/useBloodBank';
import type { BloodScreeningTest, SpecimenStatus } from '../types/bloodBank.types';

function ScreeningResultModal({ test, bagId, onClose }: { test: BloodScreeningTest; bagId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const parametersQuery = useLabTestParameters(test.lab_test_id);
  const saveResults = useSaveScreeningResults(bagId);
  const [status, setStatus] = useState<SpecimenStatus>('result');
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<Record<number, string>>({});

  const onSave = () => {
    saveResults.mutate(
      {
        results: [
          {
            screening_test_id: test.id,
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
          message.success('Screening result saved.');
          onClose();
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to save screening result.')),
      },
    );
  };

  return (
    <Modal title={`Result — ${test.lab_test_name}`} open onCancel={onClose} onOk={onSave} confirmLoading={saveResults.isPending} okText="Save Result" width={560}>
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
      ) : (
        parametersQuery.data?.map((param) => (
          <div key={param.id} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>{param.parameter_display_name}</label>
            <Input value={values[param.id] ?? ''} onChange={(e) => setValues((prev) => ({ ...prev, [param.id]: e.target.value }))} />
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

export function BloodBagDetailPage() {
  const { bagId } = useParams<{ bagId: string }>();
  const id = Number(bagId);
  const { message } = useFeedback();
  const confirm = useConfirm();

  const bagQuery = useBloodBag(id);
  const issuesQuery = useBloodIssues(id);
  const discardsQuery = useBloodDiscards(id);
  const saveDonorScreening = useSaveDonorScreening(id);
  const issueBlood = useIssueBlood(id);
  const discardBlood = useDiscardBlood(id);

  const [resultTarget, setResultTarget] = useState<BloodScreeningTest | null>(null);
  const [donorPanel, setDonorPanel] = useState({ hbs_ag: '', vdrl: '', mp: '', hcv: '', hiv: '', is_cleared: false, remarks: '' });
  const [issuePatientId, setIssuePatientId] = useState<number>();
  const [issuePrescription, setIssuePrescription] = useState('');
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [discardQuantity, setDiscardQuantity] = useState(1);
  const [discardRemarks, setDiscardRemarks] = useState('');

  if (bagQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (bagQuery.error || !bagQuery.data) {
    return (
      <PageContainer>
        <ErrorState error={bagQuery.error} onRetry={() => bagQuery.refetch()} />
      </PageContainer>
    );
  }

  const bag = bagQuery.data;

  const onSaveDonorScreening = () => {
    saveDonorScreening.mutate(donorPanel, {
      onSuccess: () => message.success('Donor screening saved.'),
      onError: (error) => message.error(getErrorMessage(error, 'Unable to save donor screening.')),
    });
  };

  const onIssue = () => {
    if (!issuePatientId || !issuePrescription) {
      message.error('Patient and prescription are required.');
      return;
    }
    confirm({
      title: `Issue ${issueQuantity} bag(s) to patient #${issuePatientId}?`,
      okText: 'Issue',
      onConfirm: () =>
        issueBlood.mutate(
          { patient_id: issuePatientId, patient_prescription: issuePrescription, quantity: issueQuantity },
          {
            onSuccess: () => message.success('Blood issued.'),
            onError: (error) => message.error(getErrorMessage(error, 'Unable to issue blood.')),
          },
        ),
    });
  };

  const onDiscard = () => {
    if (!discardRemarks) {
      message.error('Remarks are required.');
      return;
    }
    confirm({
      title: `Discard ${discardQuantity} bag(s)?`,
      okText: 'Discard',
      danger: true,
      onConfirm: () =>
        discardBlood.mutate(
          { quantity: discardQuantity, remarks: discardRemarks },
          {
            onSuccess: () => message.success('Blood discarded.'),
            onError: (error) => message.error(getErrorMessage(error, 'Unable to discard blood.')),
          },
        ),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Blood Bag — ${bag.bag_number ?? `#${bag.id}`}`}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Blood Bank' }, { label: 'Inventory', path: '/blood-bank/bags' }, { label: bag.bag_number ?? `#${bag.id}` }]}
      />

      <SectionCard title="Bag Details">
        <DetailGrid>
          <DetailItem label="Blood Group" value={bag.blood_group} />
          <DetailItem label="Quantity" value={`${bag.quantity} / ${bag.original_quantity}`} />
          <DetailItem label="Donor Name" value={bag.donor_name} />
          <DetailItem label="Donor CNIC" value={bag.donor_cnic} />
          <DetailItem label="Expiry Date" value={bag.expiry_date} />
          <DetailItem label="Screening" value={<StatusBadge label={bag.is_screening_cleared ? 'Cleared' : 'Pending'} tone={bag.is_screening_cleared ? 'success' : 'warning'} />} />
        </DetailGrid>
      </SectionCard>

      {bag.is_pre_screened && (
        <SectionCard title="Donor Rapid Screening">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {(['hbs_ag', 'vdrl', 'mp', 'hcv', 'hiv'] as const).map((key) => (
              <div key={key} style={{ minWidth: 140 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, textTransform: 'uppercase' }}>{key.replace('_', ' ')}</label>
                <Input value={donorPanel[key]} onChange={(e) => setDonorPanel((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="Non-Reactive" />
              </div>
            ))}
          </div>
          <Button type="primary" onClick={onSaveDonorScreening} loading={saveDonorScreening.isPending}>
            Save Screening
          </Button>
        </SectionCard>
      )}

      <SectionCard title="Lab Screening Tests">
        {bag.screening_tests.length === 0 ? (
          <EmptyState title="No screening tests filed" />
        ) : (
          <List
            dataSource={bag.screening_tests}
            renderItem={(t) => (
              <List.Item
                actions={[
                  <Button key="result" size="small" type="primary" onClick={() => setResultTarget(t)}>
                    Enter Result
                  </Button>,
                ]}
              >
                <List.Item.Meta title={<span>{t.lab_test_name} <StatusBadge label={t.specimen_status} /></span>} description={t.is_resulted ? 'Resulted' : 'Pending'} />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Issue Blood">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Patient ID</label>
            <InputNumber value={issuePatientId} onChange={(v) => setIssuePatientId(v ?? undefined)} min={1} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Prescription</label>
            <Input value={issuePrescription} onChange={(e) => setIssuePrescription(e.target.value)} style={{ width: 220 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity</label>
            <InputNumber value={issueQuantity} onChange={(v) => setIssueQuantity(v ?? 1)} min={1} max={bag.quantity} />
          </div>
          <Button type="primary" icon={<Send size={14} />} onClick={onIssue} loading={issueBlood.isPending}>
            Issue
          </Button>
        </div>
        {(issuesQuery.data?.length ?? 0) > 0 && (
          <List
            style={{ marginTop: 16 }}
            size="small"
            dataSource={issuesQuery.data}
            renderItem={(i) => (
              <List.Item>
                Patient #{i.patient_id} — {i.quantity} bag(s) · {i.patient_prescription} · {i.created_at}
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Discard Blood">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Quantity</label>
            <InputNumber value={discardQuantity} onChange={(v) => setDiscardQuantity(v ?? 1)} min={1} max={bag.quantity} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Remarks</label>
            <Input value={discardRemarks} onChange={(e) => setDiscardRemarks(e.target.value)} placeholder="Expired" style={{ width: 220 }} />
          </div>
          <Button danger icon={<Trash2 size={14} />} onClick={onDiscard} loading={discardBlood.isPending}>
            Discard
          </Button>
        </div>
        {(discardsQuery.data?.length ?? 0) > 0 && (
          <List
            style={{ marginTop: 16 }}
            size="small"
            dataSource={discardsQuery.data}
            renderItem={(d) => (
              <List.Item>
                {d.quantity} bag(s) — {d.remarks} · {d.created_at}
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      {resultTarget && <ScreeningResultModal test={resultTarget} bagId={id} onClose={() => setResultTarget(null)} />}
    </PageContainer>
  );
}
