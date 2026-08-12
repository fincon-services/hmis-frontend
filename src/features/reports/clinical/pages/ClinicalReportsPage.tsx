import { useMemo, useState } from 'react';
import { Tabs, Table, DatePicker, Select, Button, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useDiagnosisTypes } from '@/features/clinical/consultation/pages/DiagnosisTypesPage';
import { useWards } from '@/features/clinical/ipd/pages/WardsPage';

const SCREEN = 'clinical-reports.view';

const originOptions = [
  { label: 'All Origins', value: undefined },
  { label: 'OPD', value: 'OPD' },
  { label: 'ER', value: 'ER' },
];

function useDateRange(initialDays = 30) {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([dayjs().subtract(initialDays, 'day'), dayjs()]);
  const params = range ? { date_from: range[0].format('YYYY-MM-DD'), date_to: range[1].format('YYYY-MM-DD') } : null;
  return { range, setRange, params };
}

function RangeControls({
  range,
  setRange,
  onRun,
  loading,
  extra,
}: {
  range: [dayjs.Dayjs, dayjs.Dayjs] | null;
  setRange: (v: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
  onRun: () => void;
  loading: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
      {extra}
      <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
        Run
      </Button>
    </div>
  );
}

interface RegistrationRow {
  day: string;
  origin: string;
  gender: string;
  total: number;
}

function RegistrationsTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange();
  const [origin, setOrigin] = useState<string>();
  const [rows, setRows] = useState<RegistrationRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<RegistrationRow[]>('/clinical-reports/registrations', { params: { ...params, origin }, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate registrations report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<RegistrationRow> = [
    { title: 'Day', dataIndex: 'day', width: 140 },
    { title: 'Origin', dataIndex: 'origin', width: 100 },
    { title: 'Gender', dataIndex: 'gender', width: 100 },
    { title: 'Total', dataIndex: 'total', width: 100 },
  ];

  return (
    <div>
      <RangeControls
        range={range}
        setRange={setRange}
        onRun={onRun}
        loading={loading}
        extra={<Select allowClear placeholder="Origin" style={{ width: 140 }} value={origin} onChange={setOrigin} options={originOptions} />}
      />
      {rows && <Table<RegistrationRow> columns={columns} dataSource={rows} rowKey={(r) => `${r.day}-${r.origin}-${r.gender}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface WaitTimeRow {
  opd_visit_id: number;
  patient_id: number;
  patient_name: string;
  origin: string;
  visit_date: string;
  is_follow_up: boolean;
  vitals_recorded_at: string;
  wait_minutes: number;
}

function VisitWaitTimesTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(7);
  const [origin, setOrigin] = useState<string>();
  const [rows, setRows] = useState<WaitTimeRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<WaitTimeRow[]>('/clinical-reports/visit-wait-times', { params: { ...params, origin }, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate visit wait-times report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<WaitTimeRow> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Origin', dataIndex: 'origin', width: 90 },
    { title: 'Visit Date', dataIndex: 'visit_date', width: 140 },
    { title: 'Follow-up', dataIndex: 'is_follow_up', width: 100, render: (v: boolean) => (v ? 'Yes' : 'No') },
    { title: 'Vitals Recorded', dataIndex: 'vitals_recorded_at', width: 170 },
    { title: 'Wait (min)', dataIndex: 'wait_minutes', width: 110 },
  ];

  return (
    <div>
      <RangeControls
        range={range}
        setRange={setRange}
        onRun={onRun}
        loading={loading}
        extra={<Select allowClear placeholder="Origin" style={{ width: 140 }} value={origin} onChange={setOrigin} options={originOptions} />}
      />
      {rows && <Table<WaitTimeRow> columns={columns} dataSource={rows} rowKey="opd_visit_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface FunnelRow {
  day: string;
  opd_registrations: number;
  referred_to_er: number;
  admitted_to_ipd: number;
  medicine_dispensed: number;
  lab_prescribed: number;
  referred_elsewhere: number;
}

interface FunnelPatient {
  id: number;
  mr_no: string;
  name: string;
  gender: string;
}

const funnelStages = [
  { label: 'Referred to ER', value: 'referred_to_er' },
  { label: 'Admitted to IPD', value: 'admitted_to_ipd' },
  { label: 'Medicine Dispensed', value: 'medicine_dispensed' },
  { label: 'Lab Prescribed', value: 'lab_prescribed' },
  { label: 'Referred Elsewhere', value: 'referred_elsewhere' },
];

function OpdFunnelTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange();
  const [rows, setRows] = useState<FunnelRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>();
  const [breakup, setBreakup] = useState<FunnelPatient[] | null>(null);
  const [breakupLoading, setBreakupLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<FunnelRow[]>('/clinical-reports/opd-funnel', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate OPD funnel report.')))
      .finally(() => setLoading(false));
  };

  const onBreakup = () => {
    if (!params || !stage) return;
    setBreakupLoading(true);
    apiClient
      .get<FunnelPatient[]>('/clinical-reports/opd-funnel/patients', { params: { ...params, stage }, screenKey: SCREEN })
      .then((r) => setBreakup(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load OPD funnel breakup.')))
      .finally(() => setBreakupLoading(false));
  };

  const columns: ColumnsType<FunnelRow> = [
    { title: 'Day', dataIndex: 'day', width: 140 },
    { title: 'OPD Registrations', dataIndex: 'opd_registrations', width: 150 },
    { title: 'Referred to ER', dataIndex: 'referred_to_er', width: 130 },
    { title: 'Admitted to IPD', dataIndex: 'admitted_to_ipd', width: 140 },
    { title: 'Medicine Dispensed', dataIndex: 'medicine_dispensed', width: 160 },
    { title: 'Lab Prescribed', dataIndex: 'lab_prescribed', width: 130 },
    { title: 'Referred Elsewhere', dataIndex: 'referred_elsewhere', width: 160 },
  ];

  const breakupColumns: ColumnsType<FunnelPatient> = [
    { title: 'MR No.', dataIndex: 'mr_no', width: 120 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Gender', dataIndex: 'gender', width: 100 },
  ];

  return (
    <div>
      <RangeControls range={range} setRange={setRange} onRun={onRun} loading={loading} />
      {rows && <Table<FunnelRow> columns={columns} dataSource={rows} rowKey="day" size="small" pagination={false} scroll={{ x: 'max-content' }} style={{ marginBottom: 24 }} />}

      <h4>Patient Drill-down</h4>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select placeholder="Funnel Stage" style={{ width: 220 }} value={stage} onChange={setStage} options={funnelStages} />
        <Button onClick={onBreakup} loading={breakupLoading} disabled={!range || !stage}>
          View Patients
        </Button>
      </div>
      {breakup && <Table<FunnelPatient> columns={breakupColumns} dataSource={breakup} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface DiseaseRow {
  diagnosis_type_id: number;
  name: string;
  total: number;
}

interface DiseaseBreakupRow {
  patient_id: number;
  patient_name: string;
  diagnosis: string;
  diagnosis_type: string;
  diagnosed_by: number | null;
  date_diagnosed: string;
}

function DiseasesTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange();
  const [origin, setOrigin] = useState<string>();
  const diagnosisTypesQuery = useDiagnosisTypes({ per_page: 0 });
  const diagnosisOptions = useMemo(() => (diagnosisTypesQuery.data?.data ?? []).map((d) => ({ label: d.name, value: d.id })), [diagnosisTypesQuery.data]);
  const [diagnosisTypeId, setDiagnosisTypeId] = useState<number>();
  const [rows, setRows] = useState<DiseaseRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [breakup, setBreakup] = useState<DiseaseBreakupRow[] | null>(null);
  const [breakupLoading, setBreakupLoading] = useState(false);
  const [breakupOrigin, setBreakupOrigin] = useState<string>('OPD');

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    const endpoint = diagnosisTypeId ? '/clinical-reports/diseases/wise' : '/clinical-reports/diseases';
    apiClient
      .get<DiseaseRow[]>(endpoint, { params: { ...params, origin, diagnosis_type_id: diagnosisTypeId }, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate diseases report.')))
      .finally(() => setLoading(false));
  };

  const onBreakup = () => {
    if (!params) return;
    setBreakupLoading(true);
    apiClient
      .get<DiseaseBreakupRow[]>('/clinical-reports/diseases/patients', { params: { ...params, origin: breakupOrigin }, screenKey: SCREEN })
      .then((r) => setBreakup(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load diseases breakup.')))
      .finally(() => setBreakupLoading(false));
  };

  const columns: ColumnsType<DiseaseRow> = [
    { title: 'Diagnosis', dataIndex: 'name' },
    { title: 'Total', dataIndex: 'total', width: 100 },
  ];

  const breakupColumns: ColumnsType<DiseaseBreakupRow> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Diagnosis', dataIndex: 'diagnosis' },
    { title: 'Type', dataIndex: 'diagnosis_type', width: 120 },
    { title: 'Date', dataIndex: 'date_diagnosed', width: 170 },
  ];

  return (
    <div>
      <RangeControls
        range={range}
        setRange={setRange}
        onRun={onRun}
        loading={loading}
        extra={
          <>
            <Select allowClear placeholder="Origin" style={{ width: 140 }} value={origin} onChange={setOrigin} options={originOptions} />
            <Select allowClear placeholder="Diagnosis (optional)" style={{ width: 200 }} value={diagnosisTypeId} onChange={setDiagnosisTypeId} options={diagnosisOptions} showSearch optionFilterProp="label" />
          </>
        }
      />
      {rows && <Table<DiseaseRow> columns={columns} dataSource={rows} rowKey="diagnosis_type_id" size="small" pagination={false} scroll={{ x: 'max-content' }} style={{ marginBottom: 24 }} />}

      <h4>Patient Drill-down</h4>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select
          style={{ width: 140 }}
          value={breakupOrigin}
          onChange={setBreakupOrigin}
          options={[
            { label: 'OPD', value: 'OPD' },
            { label: 'ER', value: 'ER' },
          ]}
        />
        <Button onClick={onBreakup} loading={breakupLoading} disabled={!range}>
          View Patients
        </Button>
      </div>
      {breakup && <Table<DiseaseBreakupRow> columns={breakupColumns} dataSource={breakup} rowKey={(r) => `${r.patient_id}-${r.date_diagnosed}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface WardBurdenRow {
  ward_id: number;
  ward_name: string;
  total_diagnoses: number;
}

interface WardBurdenPatient {
  patient_id: number;
  patient_name: string;
  diagnosis: string;
}

function DiseaseBurdenTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange();
  const wardsQuery = useWards({ per_page: 0 });
  const wardOptions = useMemo(() => (wardsQuery.data?.data ?? []).map((w) => ({ label: w.name, value: w.id })), [wardsQuery.data]);
  const [rows, setRows] = useState<WardBurdenRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [wardId, setWardId] = useState<number>();
  const [breakup, setBreakup] = useState<WardBurdenPatient[] | null>(null);
  const [breakupLoading, setBreakupLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<WardBurdenRow[]>('/clinical-reports/disease-burden', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate disease burden report.')))
      .finally(() => setLoading(false));
  };

  const onBreakup = () => {
    if (!params || !wardId) return;
    setBreakupLoading(true);
    apiClient
      .get<WardBurdenPatient[]>('/clinical-reports/disease-burden/patients', { params: { ...params, ward_id: wardId }, screenKey: SCREEN })
      .then((r) => setBreakup(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load disease burden breakup.')))
      .finally(() => setBreakupLoading(false));
  };

  const columns: ColumnsType<WardBurdenRow> = [
    { title: 'Ward', dataIndex: 'ward_name' },
    { title: 'Total Diagnoses', dataIndex: 'total_diagnoses', width: 150 },
  ];

  const breakupColumns: ColumnsType<WardBurdenPatient> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Diagnosis', dataIndex: 'diagnosis' },
  ];

  return (
    <div>
      <RangeControls range={range} setRange={setRange} onRun={onRun} loading={loading} />
      {rows && <Table<WardBurdenRow> columns={columns} dataSource={rows} rowKey="ward_id" size="small" pagination={false} scroll={{ x: 'max-content' }} style={{ marginBottom: 24 }} />}

      <h4>Patient Drill-down</h4>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Select placeholder="Ward" style={{ width: 220 }} value={wardId} onChange={setWardId} options={wardOptions} />
        <Button onClick={onBreakup} loading={breakupLoading} disabled={!range || !wardId}>
          View Patients
        </Button>
      </div>
      {breakup && <Table<WardBurdenPatient> columns={breakupColumns} dataSource={breakup} rowKey={(r) => `${r.patient_id}-${r.diagnosis}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface MortalityRow {
  day: string;
  total: number;
  male: number;
  female: number;
}

function MortalityTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(90);
  const [origin, setOrigin] = useState<string>();
  const [rows, setRows] = useState<MortalityRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<MortalityRow[]>('/clinical-reports/mortality', { params: { ...params, origin }, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate mortality report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<MortalityRow> = [
    { title: 'Day', dataIndex: 'day', width: 140 },
    { title: 'Total', dataIndex: 'total', width: 100 },
    { title: 'Male', dataIndex: 'male', width: 100 },
    { title: 'Female', dataIndex: 'female', width: 100 },
  ];

  return (
    <div>
      <RangeControls
        range={range}
        setRange={setRange}
        onRun={onRun}
        loading={loading}
        extra={<Select allowClear placeholder="Origin" style={{ width: 140 }} value={origin} onChange={setOrigin} options={originOptions} />}
      />
      {rows && <Table<MortalityRow> columns={columns} dataSource={rows} rowKey="day" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface MortalityWardRow {
  ward_id: number;
  ward_name: string;
  total_deaths: number;
}

function MortalityByWardTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(90);
  const [rows, setRows] = useState<MortalityWardRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<MortalityWardRow[]>('/clinical-reports/mortality/by-ward', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate mortality-by-ward report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<MortalityWardRow> = [
    { title: 'Ward', dataIndex: 'ward_name' },
    { title: 'Total Deaths', dataIndex: 'total_deaths', width: 130 },
  ];

  return (
    <div>
      <RangeControls range={range} setRange={setRange} onRun={onRun} loading={loading} />
      {rows && <Table<MortalityWardRow> columns={columns} dataSource={rows} rowKey="ward_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface MortalityReasonRow {
  patient_id: number;
  patient_name: string;
  death_reason: string;
  discharged_at: string;
}

function MortalityByReasonTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(90);
  const [deathReason, setDeathReason] = useState('');
  const [rows, setRows] = useState<MortalityReasonRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<MortalityReasonRow[]>('/clinical-reports/mortality/by-reason', { params: { ...params, death_reason: deathReason || undefined }, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate mortality-by-reason report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<MortalityReasonRow> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Death Reason', dataIndex: 'death_reason' },
    { title: 'Discharged', dataIndex: 'discharged_at', width: 170 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Input placeholder="Death reason (optional)" value={deathReason} onChange={(e) => setDeathReason(e.target.value)} style={{ width: 220 }} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
          Run
        </Button>
      </div>
      {rows && <Table<MortalityReasonRow> columns={columns} dataSource={rows} rowKey={(r) => `${r.patient_id}-${r.discharged_at}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface ReadmissionRow {
  patient_id: number;
  patient_name: string;
  discharged_at: string;
  readmitted_at: string;
  days_between: number;
}

function UnplannedReadmissionsTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(90);
  const [rows, setRows] = useState<ReadmissionRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<ReadmissionRow[]>('/clinical-reports/readmissions/unplanned', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate unplanned readmissions report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<ReadmissionRow> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Discharged', dataIndex: 'discharged_at', width: 170 },
    { title: 'Readmitted', dataIndex: 'readmitted_at', width: 170 },
    { title: 'Days Between', dataIndex: 'days_between', width: 130 },
  ];

  return (
    <div>
      <RangeControls range={range} setRange={setRange} onRun={onRun} loading={loading} />
      {rows && <Table<ReadmissionRow> columns={columns} dataSource={rows} rowKey={(r) => `${r.patient_id}-${r.readmitted_at}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

interface WoundInfectionRow {
  patient_id: number;
  patient_name: string;
  performed_at: string;
  readmitted_at: string;
  days_between: number;
}

function WoundInfectionTab() {
  const { message } = useFeedback();
  const { range, setRange, params } = useDateRange(90);
  const [rows, setRows] = useState<WoundInfectionRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<WoundInfectionRow[]>('/clinical-reports/readmissions/wound-infection', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to generate wound infection report.')))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<WoundInfectionRow> = [
    { title: 'Patient', dataIndex: 'patient_name' },
    { title: 'Surgery Date', dataIndex: 'performed_at', width: 170 },
    { title: 'Readmitted', dataIndex: 'readmitted_at', width: 170 },
    { title: 'Days Between', dataIndex: 'days_between', width: 130 },
  ];

  return (
    <div>
      <RangeControls range={range} setRange={setRange} onRun={onRun} loading={loading} />
      {rows && <Table<WoundInfectionRow> columns={columns} dataSource={rows} rowKey={(r) => `${r.patient_id}-${r.readmitted_at}`} size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

export function ClinicalReportsPage() {
  return (
    <PageContainer>
      <PageHeader title="Clinical Reports" breadcrumbs={[{ label: 'Clinical Reports' }]} />
      <Tabs
        items={[
          { key: 'registrations', label: 'Registrations', children: <RegistrationsTab /> },
          { key: 'wait-times', label: 'Visit Wait Times', children: <VisitWaitTimesTab /> },
          { key: 'opd-funnel', label: 'OPD Funnel', children: <OpdFunnelTab /> },
          { key: 'diseases', label: 'Diseases', children: <DiseasesTab /> },
          { key: 'disease-burden', label: 'Disease Burden', children: <DiseaseBurdenTab /> },
          { key: 'mortality', label: 'Mortality', children: <MortalityTab /> },
          { key: 'mortality-ward', label: 'Mortality by Ward', children: <MortalityByWardTab /> },
          { key: 'mortality-reason', label: 'Mortality by Reason', children: <MortalityByReasonTab /> },
          { key: 'readmissions', label: 'Unplanned Readmissions', children: <UnplannedReadmissionsTab /> },
          { key: 'wound-infection', label: 'Wound Infection', children: <WoundInfectionTab /> },
        ]}
      />
    </PageContainer>
  );
}
