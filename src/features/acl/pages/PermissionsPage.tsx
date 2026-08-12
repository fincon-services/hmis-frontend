import { useState } from 'react';
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
import { ActionMenu } from '@/components/common/ActionMenu';
import { Can } from '@/app/guards/PermissionGuard';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { usePermissionsCatalog, useCreatePermission, useUpdatePermission, useDeletePermission } from '../hooks/useAcl';
import type { Permission, PermissionFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN = 'acl.permissions';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  label: z.string().max(100).optional().or(z.literal('')),
});

const fields: FieldConfig<PermissionFormValues>[] = [
  { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'e.g. dispense', helpText: 'A short, lowercase action key — this is what screens attach and roles are granted.' },
  { type: 'text', name: 'label', label: 'Display Label', placeholder: 'e.g. Dispense' },
];

export function PermissionsPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = usePermissionsCatalog();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  const [modalRecord, setModalRecord] = useState<Permission | 'new' | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PermissionFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', label: '' } });

  const openCreate = () => {
    reset({ name: '', label: '' });
    setModalRecord('new');
  };
  const openEdit = (permission: Permission) => {
    reset({ name: permission.name, label: permission.label ?? '' });
    setModalRecord(permission);
  };

  const onSubmit = (values: PermissionFormValues) => {
    const payload = { ...values, label: values.label || undefined };
    if (modalRecord === 'new') {
      createPermission.mutate(payload, {
        onSuccess: () => {
          message.success(`Permission "${values.name}" created.`);
          setModalRecord(null);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create permission.'));
        },
      });
    } else if (modalRecord) {
      updatePermission.mutate(
        { id: modalRecord.id, payload },
        {
          onSuccess: () => {
            message.success(`Permission "${values.name}" updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update permission.'));
          },
        },
      );
    }
  };

  const onDelete = (permission: Permission) => {
    confirm({
      title: `Delete "${permission.label ?? permission.name}"?`,
      content: 'Any screen or role grant referencing this permission will lose it. This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deletePermission.mutate(permission.id, {
          onSuccess: () => message.success('Permission deleted.'),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete permission.')),
        }),
    });
  };

  const columns: ColumnsType<Permission> = [
    { title: 'Name', dataIndex: 'name', render: (v: string) => <code>{v}</code> },
    { title: 'Label', dataIndex: 'label', render: (v: string | null) => v ?? '—' },
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
        title="Permissions"
        description="The global catalog of action-level permissions (view, create, update, delete, …) screens can offer and roles can be granted."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Permissions' }]}
        extra={
          <Can screen={SCREEN}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add Permission
            </Button>
          </Can>
        }
      />

      <DataTable<Permission>
        columns={columns}
        data={query.data}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="No permissions defined"
        emptyActionLabel="Add Permission"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add Permission' : 'Edit Permission'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createPermission.isPending || updatePermission.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
