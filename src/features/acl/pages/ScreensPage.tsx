import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { useScreens, useModuleTree, usePermissionsCatalog, useCreateScreen, useUpdateScreen, useDeleteScreen } from '../hooks/useAcl';
import type { Module, Screen, ScreenFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN_KEY = 'acl.screens';

const schema = z.object({
  module_id: z.number({ required_error: 'Module is required' }),
  name: z.string().min(1, 'Name is required').max(100),
  route_key: z.string().min(1, 'Route key is required').max(150),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  permission_ids: z.array(z.number()).optional(),
});

function flattenModuleNames(modules: Module[], parentName: string | null = null): { id: number; label: string }[] {
  return modules.flatMap((m) => [
    { id: m.id, label: parentName ? `${parentName} / ${m.name}` : m.name },
    ...flattenModuleNames(m.children ?? [], m.name),
  ]);
}

export function ScreensPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useScreens();
  const moduleTreeQuery = useModuleTree();
  const permissionsQuery = usePermissionsCatalog();
  const createScreen = useCreateScreen();
  const updateScreen = useUpdateScreen();
  const deleteScreen = useDeleteScreen();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalRecord, setModalRecord] = useState<Screen | 'new' | null>(null);

  const moduleNames = useMemo(() => flattenModuleNames(moduleTreeQuery.data ?? []), [moduleTreeQuery.data]);
  const moduleOptions = useMemo(() => moduleNames.map((m) => ({ label: m.label, value: m.id })), [moduleNames]);
  const moduleLabelById = useMemo(() => new Map(moduleNames.map((m) => [m.id, m.label])), [moduleNames]);
  const permissionOptions = useMemo(() => (permissionsQuery.data ?? []).map((p) => ({ label: p.label ?? p.name, value: p.id })), [permissionsQuery.data]);

  const filteredScreens = useMemo(() => {
    const all = query.data ?? [];
    if (!debouncedSearch) return all;
    const needle = debouncedSearch.toLowerCase();
    return all.filter((s) => s.name.toLowerCase().includes(needle) || s.route_key.toLowerCase().includes(needle));
  }, [query.data, debouncedSearch]);

  const fields: FieldConfig<ScreenFormValues>[] = [
    { type: 'text', name: 'name', label: 'Name', required: true, placeholder: 'e.g. Patient Registration' },
    { type: 'select', name: 'module_id', label: 'Module', required: true, options: moduleOptions },
    { type: 'text', name: 'route_key', label: 'Route Key', required: true, placeholder: 'e.g. patients.registration', helpText: 'Must match the backend screen:<route_key> middleware exactly.' },
    { type: 'number', name: 'sort_order', label: 'Sort Order', min: 0 },
    { type: 'switch', name: 'is_active', label: 'Active' },
  ];

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScreenFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', route_key: '', sort_order: 0, is_active: true, permission_ids: [] } });

  const selectedPermissionIds = watch('permission_ids') ?? [];

  const openCreate = () => {
    reset({ name: '', route_key: '', sort_order: 0, is_active: true, permission_ids: (permissionsQuery.data ?? []).map((p) => p.id), module_id: undefined as unknown as number });
    setModalRecord('new');
  };
  const openEdit = (screen: Screen) => {
    reset({
      name: screen.name,
      module_id: screen.module_id,
      route_key: screen.route_key,
      sort_order: screen.sort_order,
      is_active: screen.is_active,
      permission_ids: (screen.permissions ?? []).map((p) => p.id),
    });
    setModalRecord(screen);
  };

  const onSubmit = (values: ScreenFormValues) => {
    if (modalRecord === 'new') {
      createScreen.mutate(values, {
        onSuccess: () => {
          message.success(`Screen "${values.name}" created.`);
          setModalRecord(null);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create screen.'));
        },
      });
    } else if (modalRecord) {
      updateScreen.mutate(
        { id: modalRecord.id, payload: values },
        {
          onSuccess: () => {
            message.success(`Screen "${values.name}" updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update screen.'));
          },
        },
      );
    }
  };

  const onDelete = (screen: Screen) => {
    confirm({
      title: `Delete "${screen.name}"?`,
      content: 'Any role grants for this screen will be removed, and the backend route it gates will become fail-closed to every role. This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deleteScreen.mutate(screen.id, {
          onSuccess: () => message.success(`Screen "${screen.name}" deleted.`),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete screen.')),
        }),
    });
  };

  const columns: ColumnsType<Screen> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Module', key: 'module', render: (_, r) => moduleLabelById.get(r.module_id) ?? `#${r.module_id}` },
    { title: 'Route Key', dataIndex: 'route_key', render: (v: string) => <code>{v}</code> },
    { title: 'Permissions', key: 'permissions', width: 120, render: (_, r) => r.permissions?.length ?? 0 },
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
        title="Screens"
        description="Every backend-protected screen (route_key) and the permissions it can offer to roles."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Screens' }]}
        extra={
          <Can screen={SCREEN_KEY}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add Screen
            </Button>
          </Can>
        }
      />

      <DataTable<Screen>
        columns={columns}
        data={filteredScreens}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search screens…" />
          </FilterBar>
        }
        emptyTitle="No screens found"
        emptyActionLabel="Add Screen"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add Screen' : 'Edit Screen'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createScreen.isPending || updateScreen.isPending}
        width={600}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Available Permissions</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {permissionOptions.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={selectedPermissionIds.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedPermissionIds, opt.value]
                      : selectedPermissionIds.filter((id) => id !== opt.value);
                    setValue('permission_ids', next, { shouldDirty: true });
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </FormModal>
    </PageContainer>
  );
}
