import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from '@/lib/crud/createCrudApi';
import { createCrudHooks } from '@/lib/crud/createCrudHooks';
import { CrudResourcePage } from '@/lib/crud/CrudResourcePage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

export interface Skill {
  id: number;
  name: string;
  description: string | null;
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export const skillsApi = createCrudApi<Skill, FormValues>('/admin/skills', 'admin.skills');
const hooks = createCrudHooks('admin.skills', skillsApi);
export const useSkills = hooks.useList;

const columns: ColumnsType<Skill> = [
  { title: 'Name', dataIndex: 'name', sorter: true },
  { title: 'Description', dataIndex: 'description', ellipsis: true },
];

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'IV Cannulation' },
  { type: 'textarea', name: 'description', label: 'Description', placeholder: 'Peripheral IV line insertion' },
];

export function SkillsPage() {
  return (
    <CrudResourcePage<Skill, FormValues>
      title="Skills"
      singularTitle="Skill"
      screenKey="admin.skills"
      breadcrumbs={[{ label: 'Administration' }, { label: 'HR Setup' }, { label: 'Skills' }]}
      columns={columns}
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', description: '' }}
      toFormValues={(r) => ({ name: r.name, description: r.description ?? '' })}
      recordLabel={(r) => r.name}
      hooks={hooks}
    />
  );
}
