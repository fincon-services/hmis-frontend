import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Can } from '@/app/guards/PermissionGuard';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useModuleTree, useCreateModule, useUpdateModule, useDeleteModule } from '../hooks/useAcl';
import type { Module, ModuleFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN = 'acl.modules';

const schema = z.object({
  parent_id: z.number().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100),
  icon: z.string().max(50).optional().or(z.literal('')),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

interface FlatModuleRow extends Module {
  parentName: string | null;
}

function flatten(modules: Module[], parentName: string | null = null): FlatModuleRow[] {
  return modules.flatMap((m) => [{ ...m, parentName }, ...flatten(m.children ?? [], m.name)]);
}

export function ModulesPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useModuleTree();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();

  const [modalRecord, setModalRecord] = useState<Module | 'new' | null>(null);

  const rows = useMemo(() => flatten(query.data ?? []).sort((a, b) => a.sort_order - b.sort_order), [query.data]);
  const parentOptions = useMemo(() => rows.map((m) => ({ label: m.parentName ? `${m.parentName} / ${m.name}` : m.name, value: m.id })), [rows]);

  const fields: FieldConfig<ModuleFormValues>[] = [
    { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'e.g. Warehouse' },
    { type: 'text', name: 'slug', label: 'Slug', required: true, placeholder: 'e.g. warehouse', helpText: 'Unique identifier, lowercase-with-dashes.' },
    { type: 'select', name: 'parent_id', label: 'Parent Module', options: parentOptions, helpText: 'Leave blank for a top-level module.' },
    { type: 'text', name: 'icon', label: 'Icon' },
    { type: 'number', name: 'sort_order', label: 'Sort Order', min: 0 },
    { type: 'switch', name: 'is_active', label: 'Active' },
  ];

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ModuleFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '', icon: '', sort_order: 0, is_active: true } });

  const openCreate = () => {
    reset({ name: '', slug: '', icon: '', sort_order: 0, is_active: true, parent_id: undefined });
    setModalRecord('new');
  };
  const openEdit = (module: Module) => {
    reset({
      name: module.name,
      slug: module.slug,
      icon: module.icon ?? '',
      sort_order: module.sort_order,
      is_active: module.is_active,
      parent_id: module.parent_id ?? undefined,
    });
    setModalRecord(module);
  };

  const onSubmit = (values: ModuleFormValues) => {
    const payload = { ...values, icon: values.icon || undefined };
    if (modalRecord === 'new') {
      createModule.mutate(payload, {
        onSuccess: () => {
          message.success(`Module "${values.name}" created.`);
          setModalRecord(null);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create module.'));
        },
      });
    } else if (modalRecord) {
      updateModule.mutate(
        { id: modalRecord.id, payload },
        {
          onSuccess: () => {
            message.success(`Module "${values.name}" updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update module.'));
          },
        },
      );
    }
  };

  const onDelete = (module: Module) => {
    confirm({
      title: `Delete "${module.name}"?`,
      content: 'Any sub-modules and screens under it will be deleted too. This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deleteModule.mutate(module.id, {
          onSuccess: () => message.success(`Module "${module.name}" deleted.`),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete module.')),
        }),
    });
  };

  const columns: ColumnsType<FlatModuleRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (v: string, r) => (r.parentName ? <span style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>↳ {v}</span> : <strong>{v}</strong>),
    },
    { title: 'Slug', dataIndex: 'slug', render: (v: string) => <code>{v}</code> },
    { title: 'Screens', key: 'screens', width: 100, render: (_, r) => r.screens?.length ?? 0 },
    { title: 'Status', dataIndex: 'is_active', width: 110, render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={v ? 'success' : 'default'} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, record) => (
        <ActionMenu
          items={[
            { key: 'edit', label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(record) },
            { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => onDelete(record) },
          ]}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Modules"
        description="The navigation tree screens are organized under."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Modules' }]}
        extra={
          <Can screen={SCREEN}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add Module
            </Button>
          </Can>
        }
      />

      <DataTable<FlatModuleRow>
        columns={columns}
        data={rows}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="No modules found"
        emptyActionLabel="Add Module"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add Module' : 'Edit Module'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createModule.isPending || updateModule.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
