import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { SurgicalProcedureStatistic } from '../types/ot.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const numberField = z.number().min(0).optional();

const schema = z.object({
  month: z.string().min(1, 'Month is required'),
  gynae_ga: numberField,
  gynae_la: numberField,
  general_surgery_ga: numberField,
  general_surgery_la: numberField,
  ent_ga: numberField,
  ent_la: numberField,
  eye_ga: numberField,
  eye_la: numberField,
  accident_trauma_ga: numberField,
  accident_trauma_la: numberField,
  other_ga: numberField,
  other_la: numberField,
});
type FormValues = z.infer<typeof schema>;

const statsApi = createCrudApi<SurgicalProcedureStatistic, FormValues>('/ot/surgical-statistics', 'ot.statistics');
const hooks = createCrudHooks('ot.surgical-statistics', statsApi);

const columns: ColumnsType<SurgicalProcedureStatistic> = [
  { title: 'Month', dataIndex: 'month', sorter: true },
  { title: 'Gynae (GA/LA)', key: 'gynae', render: (_, r) => `${r.gynae_ga} / ${r.gynae_la}` },
  { title: 'General Surgery (GA/LA)', key: 'gs', render: (_, r) => `${r.general_surgery_ga} / ${r.general_surgery_la}` },
  { title: 'ENT (GA/LA)', key: 'ent', render: (_, r) => `${r.ent_ga} / ${r.ent_la}` },
  { title: 'Eye (GA/LA)', key: 'eye', render: (_, r) => `${r.eye_ga} / ${r.eye_la}` },
  { title: 'Trauma (GA/LA)', key: 'trauma', render: (_, r) => `${r.accident_trauma_ga} / ${r.accident_trauma_la}` },
  { title: 'Other (GA/LA)', key: 'other', render: (_, r) => `${r.other_ga} / ${r.other_la}` },
  { title: 'Total GA', dataIndex: 'total_ga', width: 90 },
  { title: 'Total LA', dataIndex: 'total_la', width: 90 },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'month', label: 'Month (YYYY-MM-DD)', required: true, placeholder: '2026-08-01' },

  { type: 'section', label: 'Gynae', description: 'Procedure counts by anesthesia type.' },
  { type: 'number', name: 'gynae_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'gynae_la', label: 'Local Anesthesia', min: 0 },

  { type: 'section', label: 'General Surgery' },
  { type: 'number', name: 'general_surgery_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'general_surgery_la', label: 'Local Anesthesia', min: 0 },

  { type: 'section', label: 'ENT' },
  { type: 'number', name: 'ent_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'ent_la', label: 'Local Anesthesia', min: 0 },

  { type: 'section', label: 'Eye' },
  { type: 'number', name: 'eye_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'eye_la', label: 'Local Anesthesia', min: 0 },

  { type: 'section', label: 'Accident / Trauma' },
  { type: 'number', name: 'accident_trauma_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'accident_trauma_la', label: 'Local Anesthesia', min: 0 },

  { type: 'section', label: 'Other' },
  { type: 'number', name: 'other_ga', label: 'General Anesthesia', min: 0 },
  { type: 'number', name: 'other_la', label: 'Local Anesthesia', min: 0 },
];

export function SurgicalStatisticsPage() {
  return (
    <CrudResourcePage<SurgicalProcedureStatistic, FormValues>
      title="Surgical Statistics"
      singularTitle="Monthly Record"
      screenKey="ot.statistics"
      breadcrumbs={[{ label: 'Clinical' }, { label: 'OT' }, { label: 'Surgical Statistics' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ month: '' }}
      toFormValues={(r) => ({ month: r.month })}
      recordLabel={(r) => r.month}
      hooks={hooks}
      enableBulkDelete={false}
      enableEdit={false}
    />
  );
}
