import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, InputNumber, Tag, List, Typography } from 'antd';
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
import type { VitalType } from '../types/vitals.types';

interface LocationState {
  patient?: Patient;
  origin?: Origin;
}

interface FieldEntry {
  value: number | null;
  systolic: number | null;
  diastolic: number | null;
}

const EMPTY_ENTRY: FieldEntry = { value: null, systolic: null, diastolic: null };

/** Mirrors VitalValueIsWithinType on the backend exactly, so the message a user sees before submit matches what the API would say after. Returns null when the field is valid (including blank/untouched — partial vitals entry is legitimate). */
function validateEntry(type: VitalType, entry: FieldEntry | undefined): string | null {
  const e = entry ?? EMPTY_ENTRY;

  if (type.value_type === 'blood_pressure') {
    const sFilled = e.systolic !== null;
    const dFilled = e.diastolic !== null;
    if (!sFilled && !dFilled) return null;
    if (sFilled !== dFilled) return `Please enter both systolic and diastolic values for ${type.name}.`;
    const systolic = e.systolic as number;
    const diastolic = e.diastolic as number;
    if (systolic <= diastolic) return `Please enter a valid ${type.name} — systolic must be greater than diastolic.`;
    if (type.min_value !== null && systolic < type.min_value) return `Systolic reading must be at least ${type.min_value}.`;
    if (type.max_value !== null && systolic > type.max_value) return `Systolic reading must not exceed ${type.max_value}.`;
    if (type.min_value_secondary !== null && diastolic < type.min_value_secondary) return `Diastolic reading must be at least ${type.min_value_secondary}.`;
    if (type.max_value_secondary !== null && diastolic > type.max_value_secondary) return `Diastolic reading must not exceed ${type.max_value_secondary}.`;
    return null;
  }

  if (e.value === null) return null;
  const unit = type.unit ? ` ${type.unit}` : '';
  if (type.min_value !== null && e.value < type.min_value) return `Please enter a valid ${type.name} (at least ${type.min_value}${unit}).`;
  if (type.max_value !== null && e.value > type.max_value) return `Please enter a valid ${type.name} (no more than ${type.max_value}${unit}).`;
  return null;
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

  const [entries, setEntries] = useState<Record<number, FieldEntry>>({});
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const applicableTypes = useMemo(() => {
    const types = typesQuery.data?.data ?? [];
    if (!state.origin) return types;
    return types.filter((t) => (state.origin === 'ER' ? t.applies_to_er : t.applies_to_opd));
  }, [typesQuery.data, state.origin]);

  const updateEntry = (typeId: number, patch: Partial<FieldEntry>) => {
    const type = applicableTypes.find((t) => t.id === typeId);
    setEntries((prev) => {
      const next = { ...prev, [typeId]: { ...EMPTY_ENTRY, ...prev[typeId], ...patch } };
      if (type) setErrors((prevErrors) => ({ ...prevErrors, [typeId]: validateEntry(type, next[typeId]) }));
      return next;
    });
  };

  const onBlurField = (typeId: number) => {
    const type = applicableTypes.find((t) => t.id === typeId);
    if (!type) return;
    setErrors((prev) => ({ ...prev, [typeId]: validateEntry(type, entries[typeId]) }));
  };

  const onSubmit = () => {
    const freshErrors: Record<number, string | null> = {};
    let hasError = false;
    for (const type of applicableTypes) {
      const err = validateEntry(type, entries[type.id]);
      freshErrors[type.id] = err;
      if (err) hasError = true;
    }
    setErrors(freshErrors);
    if (hasError) {
      message.error('Please correct the highlighted fields before saving vitals.');
      return;
    }

    const vitals: Record<string, string> = {};
    for (const type of applicableTypes) {
      const entry = entries[type.id];
      if (!entry) continue;
      if (type.value_type === 'blood_pressure') {
        if (entry.systolic !== null && entry.diastolic !== null) vitals[type.id] = `${entry.systolic}/${entry.diastolic}`;
      } else if (entry.value !== null) {
        vitals[type.id] = String(entry.value);
      }
    }

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
          <div style={{ maxWidth: 560 }}>
            {applicableTypes.map((type) => {
              const entry = entries[type.id];
              const error = errors[type.id];

              if (type.value_type === 'blood_pressure') {
                return (
                  <div key={type.id} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>{type.name}</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#4d5c6b', marginBottom: 4 }}>Systolic</div>
                        <InputNumber
                          style={{ width: '100%' }}
                          status={error ? 'error' : undefined}
                          precision={0}
                          min={0}
                          value={entry?.systolic ?? null}
                          onChange={(v) => updateEntry(type.id, { systolic: v })}
                          onBlur={() => onBlurField(type.id)}
                          placeholder="120"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#4d5c6b', marginBottom: 4 }}>Diastolic</div>
                        <InputNumber
                          style={{ width: '100%' }}
                          status={error ? 'error' : undefined}
                          precision={0}
                          min={0}
                          value={entry?.diastolic ?? null}
                          onChange={(v) => updateEntry(type.id, { diastolic: v })}
                          onBlur={() => onBlurField(type.id)}
                          placeholder="80"
                        />
                      </div>
                    </div>
                    {error && <div style={{ color: '#b3261e', fontSize: 12, marginTop: 4 }}>{error}</div>}
                  </div>
                );
              }

              return (
                <div key={type.id} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>{type.name}</label>
                  <InputNumber
                    style={{ width: '100%' }}
                    status={error ? 'error' : undefined}
                    addonAfter={type.unit || undefined}
                    value={entry?.value ?? null}
                    onChange={(v) => updateEntry(type.id, { value: v })}
                    onBlur={() => onBlurField(type.id)}
                    placeholder="Enter value"
                  />
                  {error && <div style={{ color: '#b3261e', fontSize: 12, marginTop: 4 }}>{error}</div>}
                </div>
              );
            })}
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
