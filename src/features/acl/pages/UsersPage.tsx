import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
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
import { employeeApi } from '@/features/hr/employees/api/employeeApi';
import { useAclUsers, useCreateAclUser, useUpdateAclUser, useDeleteAclUser } from '../hooks/useAcl';
import type { AclUser, AclUserFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN = 'admin.users';

const schema = z
  .object({
    employee_id: z.number().optional(),
    username: z.string().min(1, 'Username is required').max(100),
    email: z.string().email('Enter a valid email').max(150).optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
    password_confirmation: z.string().optional().or(z.literal('')),
    is_active: z.boolean().optional(),
  })
  .refine((d) => !d.password || d.password.length >= 8, { message: 'Password must be at least 8 characters', path: ['password'] })
  .refine((d) => !(d.password || d.password_confirmation) || d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

const fields: FieldConfig<AclUserFormValues>[] = [
  { type: 'text', name: 'username', label: 'Username', required: true },
  { type: 'text', name: 'email', label: 'Email' },
  { type: 'password', name: 'password', label: 'Password', autoComplete: 'new-password' },
  { type: 'password', name: 'password_confirmation', label: 'Confirm Password', autoComplete: 'new-password' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function UsersPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useAclUsers();
  const createUser = useCreateAclUser();
  const updateUser = useUpdateAclUser();
  const deleteUser = useDeleteAclUser();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalRecord, setModalRecord] = useState<AclUser | 'new' | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const debouncedEmployeeSearch = useDebounce(employeeSearchTerm, 300);

  const employeeSearchQuery = useQuery({
    queryKey: ['acl-user-employee-search', debouncedEmployeeSearch],
    queryFn: () => employeeApi.search(debouncedEmployeeSearch),
    enabled: modalRecord === 'new' && debouncedEmployeeSearch.trim().length >= 2,
  });
  const employeeOptions = useMemo(
    () => (employeeSearchQuery.data ?? []).map((e) => ({ label: `${e.full_name} (${e.employee_code})`, value: e.id })),
    [employeeSearchQuery.data],
  );

  const filteredUsers = useMemo(() => {
    const all = query.data ?? [];
    if (!debouncedSearch) return all;
    const needle = debouncedSearch.toLowerCase();
    return all.filter((u) => matchesUser(u, needle));
  }, [query.data, debouncedSearch]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AclUserFormValues & { employee_id?: number }>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '', password_confirmation: '', is_active: true },
  });

  const openCreate = () => {
    reset({ username: '', email: '', password: '', password_confirmation: '', is_active: true, employee_id: undefined });
    setEmployeeSearchTerm('');
    setModalRecord('new');
  };
  const openEdit = (user: AclUser) => {
    reset({ username: user.username, email: user.email ?? '', password: '', password_confirmation: '', is_active: user.is_active });
    setModalRecord(user);
  };

  const onSubmit = (values: AclUserFormValues & { employee_id?: number }) => {
    const { employee_id, password, password_confirmation, ...rest } = values;
    const payload: AclUserFormValues = {
      ...rest,
      email: values.email || undefined,
      ...(password ? { password, password_confirmation } : {}),
    };

    if (modalRecord === 'new') {
      if (!employee_id) {
        setError('employee_id', { message: 'Please search for and select an employee.' });
        return;
      }
      if (!password) {
        setError('password', { message: 'Password is required.' });
        return;
      }
      createUser.mutate(
        { ...payload, employee_id },
        {
          onSuccess: () => {
            message.success(`User "${values.username}" created.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create user.'));
          },
        },
      );
    } else if (modalRecord) {
      updateUser.mutate(
        { id: modalRecord.id, payload },
        {
          onSuccess: () => {
            message.success(`User "${values.username}" updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update user.'));
          },
        },
      );
    }
  };

  const onDelete = (user: AclUser) => {
    confirm({
      title: `Delete "${user.username}"?`,
      content: 'This permanently removes the account and every role it holds. This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deleteUser.mutate(user.id, {
          onSuccess: () => message.success(`User "${user.username}" deleted.`),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete user.')),
        }),
    });
  };

  const columns: ColumnsType<AclUser> = [
    { title: 'Employee', key: 'employee', render: (_, r) => r.employee_name ?? '—' },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, r) =>
        r.roles?.length ? (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {r.roles.map((role) => (
              <Tag key={role.id} icon={role.is_primary ? <Star size={11} style={{ verticalAlign: -1 }} /> : undefined}>
                {role.name}
              </Tag>
            ))}
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>No roles assigned</span>
        ),
    },
    { title: 'Last Login', dataIndex: 'last_login_at', width: 160, render: (v: string | null) => (v ? dayjs(v).format('DD MMM YYYY, HH:mm') : 'Never') },
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
        title="Users"
        description="System accounts and the roles each one holds. Assign or remove roles from the Roles page."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Users' }]}
        extra={
          <Can screen={SCREEN}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add User
            </Button>
          </Can>
        }
      />

      <DataTable<AclUser>
        columns={columns}
        data={filteredUsers}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
          </FilterBar>
        }
        emptyTitle="No users found"
        emptyActionLabel="Add User"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add User' : 'Edit User'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createUser.isPending || updateUser.isPending}
        width={560}
      >
        {modalRecord === 'new' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Employee *</label>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <Select
                  showSearch
                  placeholder="Search employee by name or code…"
                  style={{ width: '100%' }}
                  value={field.value}
                  onChange={field.onChange}
                  filterOption={false}
                  onSearch={setEmployeeSearchTerm}
                  loading={employeeSearchQuery.isFetching}
                  notFoundContent={debouncedEmployeeSearch.trim().length < 2 ? 'Type at least 2 characters…' : 'No matching employees'}
                  options={employeeOptions}
                />
              )}
            />
            {errors.employee_id && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errors.employee_id.message}</div>}
          </div>
        )}
        {modalRecord && modalRecord !== 'new' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Employee</label>
            <div style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>{modalRecord.employee_name ?? '—'} (not changeable here)</div>
          </div>
        )}

        <GeneratedForm fields={fields} control={control} errors={errors} />

        {modalRecord !== 'new' && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: -8, marginBottom: 14 }}>Leave password fields blank to keep the current password.</div>
        )}
      </FormModal>
    </PageContainer>
  );
}

function matchesUser(user: AclUser, needle: string): boolean {
  return (
    user.username.toLowerCase().includes(needle) ||
    (user.employee_name ?? '').toLowerCase().includes(needle) ||
    (user.email ?? '').toLowerCase().includes(needle)
  );
}
