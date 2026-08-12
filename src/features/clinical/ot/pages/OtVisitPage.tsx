import { useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Button, Select, DatePicker, List } from 'antd';
import dayjs from 'dayjs';
import { CalendarClock, Send, Scissors } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useOtProcedures } from './OtProceduresPage';
import { useOtSchedulesForVisit, useOtSurgeriesForVisit, useScheduleSurgery, useReferToOt, useRecordSurgery } from '../hooks/useOt';
import type { Patient } from '@/features/patients/types/patient.types';
import type { AnesthesiaType } from '../types/ot.types';

interface LocationState {
  patient?: Patient;
}

export function OtVisitPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const proceduresQuery = useOtProcedures({ is_active: true, per_page: 0 });
  const schedulesQuery = useOtSchedulesForVisit(visitId);
  const surgeriesQuery = useOtSurgeriesForVisit(visitId);
  const scheduleSurgery = useScheduleSurgery(visitId);
  const referToOt = useReferToOt(visitId);
  const recordSurgery = useRecordSurgery(visitId);

  const [scheduleProcedure, setScheduleProcedure] = useState<number>();
  const [scheduleDate, setScheduleDate] = useState(dayjs());
  const [surgeryProcedure, setSurgeryProcedure] = useState<number>();
  const [anesthesia, setAnesthesia] = useState<AnesthesiaType>('general');

  const procedureOptions = useMemo(() => (proceduresQuery.data?.data ?? []).map((p) => ({ label: p.name, value: p.id })), [proceduresQuery.data]);

  const onSchedule = () => {
    if (!scheduleProcedure) {
      message.error('Select a procedure.');
      return;
    }
    scheduleSurgery.mutate(
      { ot_procedure_id: scheduleProcedure, scheduled_date: scheduleDate.format('YYYY-MM-DD') },
      {
        onSuccess: () => {
          message.success('Surgery scheduled.');
          setScheduleProcedure(undefined);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to schedule surgery.')),
      },
    );
  };

  const onRefer = (scheduleId: number) => {
    referToOt.mutate(scheduleId, {
      onSuccess: () => message.success('Patient referred to OT.'),
      onError: (error) => message.error(getErrorMessage(error, 'Unable to refer patient to OT.')),
    });
  };

  const onRecordSurgery = () => {
    if (!surgeryProcedure) {
      message.error('Select a procedure.');
      return;
    }
    recordSurgery.mutate(
      { ot_procedure_id: surgeryProcedure, anesthesia_type: anesthesia },
      {
        onSuccess: () => {
          message.success('Surgery recorded.');
          setSurgeryProcedure(undefined);
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to record surgery.')),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `OT — ${state.patient.name}` : 'OT'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'OT', path: '/ot/procedures' }, { label: 'Visit' }]}
        description={state.patient ? `MR# ${state.patient.mr_no}` : undefined}
      />

      <SectionCard title="Schedule Surgery">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Procedure</label>
            <Select style={{ width: '100%' }} options={procedureOptions} value={scheduleProcedure} onChange={setScheduleProcedure} placeholder="Select procedure" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Scheduled Date</label>
            <DatePicker value={scheduleDate} onChange={(d) => d && setScheduleDate(d)} allowClear={false} />
          </div>
          <Button type="primary" icon={<CalendarClock size={15} />} onClick={onSchedule} loading={scheduleSurgery.isPending}>
            Schedule
          </Button>
        </div>

        {schedulesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (schedulesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No surgeries scheduled yet" />
        ) : (
          <List
            dataSource={schedulesQuery.data}
            renderItem={(s) => (
              <List.Item
                actions={
                  !s.is_referred
                    ? [
                        <Button key="refer" size="small" icon={<Send size={14} />} onClick={() => onRefer(s.id)} loading={referToOt.isPending}>
                          Refer to OT
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  title={
                    <span>
                      {s.ot_procedure_name} {s.is_referred && <StatusBadge label="Referred" tone="info" />}
                    </span>
                  }
                  description={`Scheduled ${s.scheduled_date}`}
                />
              </List.Item>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="Record Surgery">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Procedure</label>
            <Select style={{ width: '100%' }} options={procedureOptions} value={surgeryProcedure} onChange={setSurgeryProcedure} placeholder="Select procedure" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Anesthesia</label>
            <Select
              style={{ width: 160 }}
              value={anesthesia}
              onChange={setAnesthesia}
              options={[
                { label: 'General', value: 'general' },
                { label: 'Local', value: 'local' },
              ]}
            />
          </div>
          <Button type="primary" icon={<Scissors size={15} />} onClick={onRecordSurgery} loading={recordSurgery.isPending}>
            Record Surgery
          </Button>
        </div>

        {surgeriesQuery.isLoading ? (
          <LoadingState rows={2} />
        ) : (surgeriesQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No surgeries recorded yet" />
        ) : (
          <List
            dataSource={surgeriesQuery.data}
            renderItem={(s) => (
              <List.Item>
                <List.Item.Meta title={s.ot_procedure_name} description={`Anesthesia: ${s.anesthesia_type}${s.performed_at ? ` · ${s.performed_at}` : ''}`} />
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
