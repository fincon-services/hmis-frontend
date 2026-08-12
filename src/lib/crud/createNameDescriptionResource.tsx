import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from './createCrudApi';
import { createCrudHooks } from './createCrudHooks';
import { CrudResourcePage } from './CrudResourcePage';
import type { BreadcrumbItem } from '@/components/common/PageHeader';
import type { FieldConfig } from '@/components/forms/FieldConfig';

interface NamedDescribedRecord {
  id: number;
  name: string;
  description: string | null;
}

const schema = z.object({ name: z.string().min(1, 'Name is required').max(150), description: z.string().max(500).optional().or(z.literal('')) });
type FormValues = z.infer<typeof schema>;

const columns: ColumnsType<NamedDescribedRecord> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Description', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v ?? '—' },
];
const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description' },
];

/** For plain `{name, description}` master-data resources: item brands, item attributes, supplier categories, etc. */
export function createNameDescriptionResource(basePath: string, screenKey: string, title: string, singularTitle: string, breadcrumbs: BreadcrumbItem[]) {
  const api = createCrudApi<NamedDescribedRecord, FormValues>(basePath, screenKey);
  const hooks = createCrudHooks(screenKey, api);

  function Page() {
    return (
      <CrudResourcePage<NamedDescribedRecord, FormValues>
        title={title}
        singularTitle={singularTitle}
        screenKey={screenKey}
        breadcrumbs={breadcrumbs}
        columns={columns}
        fields={fields}
        schema={schema}
        defaultValues={{ name: '', description: '' }}
        toFormValues={(r) => ({ name: r.name, description: r.description ?? '' })}
        recordLabel={(r) => r.name}
        hooks={hooks}
        enableBulkDelete={false}
      />
    );
  }

  return { api, hooks, Page };
}
