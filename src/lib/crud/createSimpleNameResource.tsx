import { z } from 'zod';
import type { ColumnsType } from 'antd/es/table';
import { createCrudApi } from './createCrudApi';
import { createCrudHooks } from './createCrudHooks';
import { CrudResourcePage } from './CrudResourcePage';
import type { BreadcrumbItem } from '@/components/common/PageHeader';
import type { FieldConfig } from '@/components/forms/FieldConfig';

interface NamedRecord {
  id: number;
  name: string;
}

const schema = z.object({ name: z.string().min(1, 'Name is required').max(150) });
type FormValues = z.infer<typeof schema>;

const columns: ColumnsType<NamedRecord> = [{ title: 'Name', dataIndex: 'name' }];
const fields: FieldConfig<FormValues>[] = [{ type: 'text', name: 'name', label: 'Name', required: true }];

/** For the plain `{name}`-only master-data resources: education levels, employment statuses, languages. */
export function createSimpleNameResource(
  basePath: string,
  screenKey: string,
  title: string,
  singularTitle: string,
  breadcrumbs: BreadcrumbItem[],
) {
  const api = createCrudApi<NamedRecord, FormValues>(basePath, screenKey);
  const hooks = createCrudHooks(screenKey, api);

  function Page() {
    return (
      <CrudResourcePage<NamedRecord, FormValues>
        title={title}
        singularTitle={singularTitle}
        screenKey={screenKey}
        breadcrumbs={breadcrumbs}
        columns={columns}
        fields={fields}
        schema={schema}
        defaultValues={{ name: '' }}
        toFormValues={(r) => ({ name: r.name })}
        recordLabel={(r) => r.name}
        hooks={hooks}
      />
    );
  }

  return { api, hooks, Page };
}
