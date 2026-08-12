import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Tag, List, Typography } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useVitalTypes } from './VitalTypesPage';
import { useVitalsForVisit, useRecordVitals } from '../hooks/useVitals';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import type { Patient, Origin } from '@/features/patients/types/patient.types';

interface LocationState {
  patient?: Patient;
  origin?: Origin;
}

export function VitalsRecordPage() {
  const { opdVisitId } = useParams<{ opdVisitId: string }>();
  const visitId = Number(opdVisitId);
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = useFeedback();
  const state = (location.state as LocationState) ?? {};

  const typesQuery = useVitalTypes({ is_active: true, per_page: 0 });
  const existingQuery = useVitalsForVisit(visitId);
  const recordVitals = useRecordVitals(visitId, state.patient?.id ?? 0);

  const [values, setValues] = useState<Record<number, string>>({});

  const applicableTypes = useMemo(() => {
    const types = typesQuery.data?.data ?? [];
    if (!state.origin) return types;
    return types.filter((t) => (state.origin === 'ER' ? t.applies_to_er : t.applies_to_opd));
  }, [typesQuery.data, state.origin]);

  const onSubmit = () => {
    const vitals = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim() !== ''));
    if (Object.keys(vitals).length === 0) {
      message.error('Enter at least one vital reading.');
      return;
    }
    recordVitals.mutate(
      { vitals },
      {
        onSuccess: () => {
          message.success('Vitals recorded.');
          navigate('/vitals/queue');
        },
        onError: (error) => message.error(getErrorMessage(error, 'Unable to record vitals.')),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={state.patient ? `Record Vitals — ${state.patient.name}` : 'Record Vitals'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Vitals', path: '/vitals/queue' }, { label: 'Record' }]}
        description={state.patient ? `MR# ${state.patient.mr_no}${state.origin ? ` · ${state.origin}` : ''}` : undefined}
      />

      <SectionCard title="New Reading">
        {typesQuery.isLoading ? (
          <LoadingState rows={4} />
        ) : applicableTypes.length === 0 ? (
          <EmptyState title="No active vital types configured" />
        ) : (
          <div style={{ maxWidth: 480 }}>
            {applicableTypes.map((type) => (
              <div key={type.id} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>{type.name}</label>
                <Input
                  value={values[type.id] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [type.id]: e.target.value }))}
                  placeholder="Enter value"
                />
              </div>
            ))}
            <Button type="primary" onClick={onSubmit} loading={recordVitals.isPending}>
              Save Vitals
            </Button>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Already Recorded This Visit">
        {existingQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : (existingQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No vitals recorded yet for this visit" />
        ) : (
          <List
            dataSource={existingQuery.data}
            renderItem={(v) => (
              <List.Item>
                <Typography.Text strong>{v.vital_type_name ?? `Type #${v.vital_type_id}`}</Typography.Text>
                <Tag style={{ marginLeft: 8 }}>{v.value}</Tag>
              </List.Item>
            )}
          />
        )}
      </SectionCard>
    </PageContainer>
  );
}
