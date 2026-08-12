import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, ShieldCheck, Trash2, Pencil } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Can } from '@/app/guards/PermissionGuard';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { useDebounce } from '@/hooks/useDebounce';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useAcl';
import type { Role, RoleFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN = 'acl.roles';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

const fields: FieldConfig<RoleFormValues>[] = [
  { type: 'text', name: 'name', label: 'Role Name', required: true, placeholder: 'e.g. Doctor' },
  { type: 'textarea', name: 'description', label: 'Description', placeholder: 'What this role is for' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function RolesPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const confirm = useConfirm();

  const rolesQuery = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalRecord, setModalRecord] = useState<Role | 'new' | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoleFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '', is_active: true } });

  const filteredRoles = useMemo(() => {
    const all = rolesQuery.data ?? [];
    if (!debouncedSearch) return all;
    const needle = debouncedSearch.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(needle) || (r.description ?? '').toLowerCase().includes(needle));
  }, [rolesQuery.data, debouncedSearch]);

  const openCreate = () => {
    reset({ name: '', description: '', is_active: true });
    setModalRecord('new');
  };

  const openEdit = (role: Role) => {
    reset({ name: role.name, description: role.description ?? '', is_active: role.is_active });
    setModalRecord(role);
  };

  const onSubmit = (values: RoleFormValues) => {
    if (modalRecord === 'new') {
      createRole.mutate(
        { ...values, description: values.description || undefined },
        {
          onSuccess: () => {
            message.success(`Role "${values.name}" created.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create role.'));
          },
        },
      );
    } else if (modalRecord) {
      updateRole.mutate(
        { id: modalRecord.id, payload: { ...values, description: values.description || undefined } },
        {
          onSuccess: () => {
            message.success(`Role "${values.name}" updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update role.'));
          },
        },
      );
    }
  };

  const onDelete = (role: Role) => {
    confirm({
      title: `Delete "${role.name}"?`,
      content: 'Every user holding this role and its screen/permission grants will lose them. This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deleteRole.mutate(role.id, {
          onSuccess: () => message.success(`Role "${role.name}" deleted.`),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete role.')),
        }),
    });
  };

  const columns: ColumnsType<Role> = [
    { title: 'Role', dataIndex: 'name', render: (v: string) => <strong>{v}</strong> },
    { title: 'Description', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
    { title: 'Status', dataIndex: 'is_active', width: 110, render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={v ? 'success' : 'default'} /> },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, record) => (
        <ActionMenu
          items={[
            { key: 'access', label: 'Manage Access', icon: <ShieldCheck size={14} />, onClick: () => navigate(`/administration/roles/${record.id}`) },
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
        title="Roles"
        description="Manage roles and the screens/permissions each one grants."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Roles' }]}
        extra={
          <Can screen={SCREEN}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add Role
            </Button>
          </Can>
        }
      />

      <DataTable<Role>
        columns={columns}
        data={filteredRoles}
        rowKey="id"
        loading={rolesQuery.isLoading}
        error={rolesQuery.error}
        onRetry={() => rolesQuery.refetch()}
        onRowClick={(record) => navigate(`/administration/roles/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search roles…" />
          </FilterBar>
        }
        emptyTitle="No roles found"
        emptyDescription="Create a role to start granting screen and permission access."
        emptyActionLabel="Add Role"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add Role' : 'Edit Role'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createRole.isPending || updateRole.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
