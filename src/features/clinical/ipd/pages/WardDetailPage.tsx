import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Select, List, Tag, Modal, Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { ArrowRightLeft, LogOut } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useWards } from './WardsPage';
import { useWardBeds, useWardAdmissions, useTransferAdmission, useDischargeAdmission } from '../hooks/useIpd';
import type { WardAdmission } from '../types/ipd.types';

function TransferModal({ admission, wardId, onClose }: { admission: WardAdmission; wardId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const wardsQuery = useWards({ per_page: 0 });
  const [targetWard, setTargetWard] = useState<number | undefined>(undefined);
  const bedsQuery = useWardBeds(targetWard ?? 0);
  const [targetBed, setTargetBed] = useState<number | undefined>(undefined);
  const transfer = useTransferAdmission(wardId);

  const wardOptions = useMemo(() => (wardsQuery.data?.data ?? []).map((w) => ({ label: w.name, value: w.id })), [wardsQuery.data]);
  const bedOptions = useMemo(
    () => (bedsQuery.data ?? []).filter((b) => !b.is_occupied).map((b) => ({ label: b.bed_no, value: b.id })),
    [bedsQuery.data],
  );

  const onSubmit = () => {
    if (!targetWard || !targetBed) {
      message.error('Select destination ward and bed.');
      return;
    }
    transfer.mutate(
      { admissionId: admission.id, payload: { ward_id: targetWard, bed_id: targetBed } },
      {
        onSuccess: () => {
          message.success('Patient transferred.');
          onClose();
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to transfer patient.')),
      },
    );
  };

  return (
    <Modal title={`Transfer — ${admission.patient?.name ?? `Patient #${admission.patient_id}`}`} open onCancel={onClose} onOk={onSubmit} confirmLoading={transfer.isPending} okText="Transfer">
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Destination Ward</label>
        <Select style={{ width: '100%' }} options={wardOptions} value={targetWard} onChange={(v) => { setTargetWard(v); setTargetBed(undefined); }} />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Destination Bed</label>
        <Select style={{ width: '100%' }} options={bedOptions} value={targetBed} onChange={setTargetBed} disabled={!targetWard} placeholder={targetWard ? 'Select a free bed' : 'Select a ward first'} />
      </div>
    </Modal>
  );
}

function DischargeModal({ admission, wardId, onClose }: { admission: WardAdmission; wardId: number; onClose: () => void }) {
  const { message } = useFeedback();
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [level, setLevel] = useState('');
  const [dischargeDate, setDischargeDate] = useState(dayjs());
  const discharge = useDischargeAdmission(wardId);

  const onSubmit = () => {
    discharge.mutate(
      {
        admissionId: admission.id,
        payload: {
          discharge_notes: notes || undefined,
          treatment_advice: advice || undefined,
          discharge_level: level || undefined,
          discharge_date: dischargeDate.format('YYYY-MM-DD'),
        },
      },
      {
        onSuccess: () => {
          message.success('Patient discharged.');
          onClose();
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to discharge patient.')),
      },
    );
  };

  return (
    <Modal title={`Discharge — ${admission.patient?.name ?? `Patient #${admission.patient_id}`}`} open onCancel={onClose} onOk={onSubmit} confirmLoading={discharge.isPending} okText="Discharge">
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Discharge Date</label>
        <DatePicker style={{ width: '100%' }} value={dischargeDate} onChange={(d) => d && setDischargeDate(d)} allowClear={false} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Discharge Level</label>
        <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Recovered" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Treatment Advice</label>
        <Input.TextArea value={advice} onChange={(e) => setAdvice(e.target.value)} rows={2} />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Discharge Notes</label>
        <Input.TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
    </Modal>
  );
}

export function WardDetailPage() {
  const { wardId } = useParams<{ wardId: string }>();
  const id = Number(wardId);
  const location = useLocation();
  const wardName = (location.state as { wardName?: string } | null)?.wardName;

  const bedsQuery = useWardBeds(id);
  const admissionsQuery = useWardAdmissions(id);

  const [transferTarget, setTransferTarget] = useState<WardAdmission | null>(null);
  const [dischargeTarget, setDischargeTarget] = useState<WardAdmission | null>(null);

  return (
    <PageContainer>
      <PageHeader title={wardName ? `Ward — ${wardName}` : 'Ward'} breadcrumbs={[{ label: 'Clinical' }, { label: 'IPD' }, { label: 'Wards', path: '/ipd/wards' }, { label: wardName ?? 'Detail' }]} />

      <SectionCard title="Beds">
        {bedsQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {bedsQuery.data?.map((bed) => (
              <div key={bed.id} style={{ border: '1px solid #d7dde3', borderRadius: 6, padding: '8px 12px', minWidth: 90, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{bed.bed_no}</div>
                <StatusBadge label={bed.is_occupied ? 'Occupied' : 'Free'} tone={bed.is_occupied ? 'warning' : 'success'} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Active Admissions">
        {admissionsQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : (admissionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No active admissions in this ward" />
        ) : (
          <List
            dataSource={admissionsQuery.data}
            renderItem={(a) => (
              <List.Item
                actions={[
                  <Button key="transfer" size="small" icon={<ArrowRightLeft size={14} />} onClick={() => setTransferTarget(a)}>
                    Transfer
                  </Button>,
                  <Button key="discharge" size="small" danger icon={<LogOut size={14} />} onClick={() => setDischargeTarget(a)}>
                    Discharge
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={a.patient?.name ?? `Patient #${a.patient_id}`}
                  description={
                    <span>
                      Bed {a.bed_no} <Tag>Admitted {a.admitted_at}</Tag>
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      {transferTarget && <TransferModal admission={transferTarget} wardId={id} onClose={() => setTransferTarget(null)} />}
      {dischargeTarget && <DischargeModal admission={dischargeTarget} wardId={id} onClose={() => setDischargeTarget(null)} />}
    </PageContainer>
  );
}
