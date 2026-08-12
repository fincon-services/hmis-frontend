import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Tabs } from 'antd';
import { Pencil } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { Can } from '@/app/guards/PermissionGuard';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useRoles, useUpdateRole } from '../hooks/useAcl';
import { ScreenPermissionMatrix } from '../components/ScreenPermissionMatrix';
import { RoleUsersPanel } from '../components/RoleUsersPanel';
import type { RoleFormValues } from '../types/acl.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const SCREEN = 'acl.roles';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

const fields: FieldConfig<RoleFormValues>[] = [
  { type: 'text', name: 'name', label: 'Role Name', required: true },
  { type: 'textarea', name: 'description', label: 'Description' },
  { type: 'switch', name: 'is_active', label: 'Active' },
];

export function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const id = Number(roleId);
  const { message } = useFeedback();
  const [editOpen, setEditOpen] = useState(false);

  // Roles have no single-resource GET endpoint — the list is small and already cached, so find it there.
  const rolesQuery = useRoles();
  const updateRole = useUpdateRole();
  const role = rolesQuery.data?.find((r) => r.id === id);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoleFormValues>({ resolver: zodResolver(schema) });

  if (rolesQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  if (rolesQuery.error || !role) {
    return (
      <PageContainer>
        <ErrorState error={rolesQuery.error} onRetry={() => rolesQuery.refetch()} />
      </PageContainer>
    );
  }

  const openEdit = () => {
    reset({ name: role.name, description: role.description ?? '', is_active: role.is_active });
    setEditOpen(true);
  };

  const onSubmit = (values: RoleFormValues) => {
    updateRole.mutate(
      { id: role.id, payload: { ...values, description: values.description || undefined } },
      {
        onSuccess: () => {
          message.success('Role updated.');
          setEditOpen(false);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update role.'));
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title={role.name}
        description={role.description ?? undefined}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Roles', path: '/administration/roles' }, { label: role.name }]}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge label={role.is_active ? 'Active' : 'Inactive'} tone={role.is_active ? 'success' : 'default'} />
            <Can screen={SCREEN}>
              <Button icon={<Pencil size={14} />} onClick={openEdit}>
                Edit
              </Button>
            </Can>
          </div>
        }
      />

      <Tabs
        items={[
          {
            key: 'access',
            label: 'Screen & Permission Access',
            children: (
              <SectionCard title="Grant Access">
                <ScreenPermissionMatrix roleId={id} />
              </SectionCard>
            ),
          },
          {
            key: 'users',
            label: 'Assigned Users',
            children: (
              <SectionCard title="Users Holding This Role">
                <RoleUsersPanel role={role} />
              </SectionCard>
            ),
          },
        ]}
      />

      <FormModal title="Edit Role" open={editOpen} onCancel={() => setEditOpen(false)} onSubmit={handleSubmit(onSubmit)} confirmLoading={updateRole.isPending}>
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
