import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type { createCrudHooks } from './createCrudHooks';

interface RecordBase {
  id: number;
}

export interface InlineSubResourceCrudProps<T extends RecordBase, F extends FieldValues> {
  title: string;
  columns: ColumnsType<T>;
  fields: FieldConfig<F>[];
  schema: ZodType<F>;
  defaultValues: F;
  toFormValues: (record: T) => F;
  recordLabel: (record: T) => string;
  hooks: ReturnType<typeof createCrudHooks<T, F, F>>;
  /** Set false when there's no PUT route for this sub-resource. Defaults true. */
  enableEdit?: boolean;
}

/** Compact list+modal CRUD for small employee/patient-scoped sub-resources, used inline within a tab rather than as a full page. */
export function InlineSubResourceCrud<T extends RecordBase, F extends FieldValues>({
  title,
  columns,
  fields,
  schema,
  defaultValues,
  toFormValues,
  recordLabel,
  hooks,
  enableEdit = true,
}: InlineSubResourceCrudProps<T, F>) {
  const listQuery = hooks.useList({ per_page: 0 });
  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const removeMutation = hooks.useRemove();
  const { message } = useFeedback();
  const confirm = useConfirm();

  const [modalRecord, setModalRecord] = useState<T | 'new' | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<F>({ resolver: zodResolver(schema), defaultValues: defaultValues as never });

  const openCreate = () => {
    reset(defaultValues as never);
    setModalRecord('new');
  };
  const openEdit = (record: T) => {
    reset(toFormValues(record) as never);
    setModalRecord(record);
  };

  const onSubmit = (values: F) => {
    if (modalRecord === 'new') {
      createMutation.mutate(values, {
        onSuccess: () => {
          message.success(`${title} added.`);
          setModalRecord(null);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, `Unable to add ${title.toLowerCase()}.`));
        },
      });
    } else if (modalRecord) {
      updateMutation.mutate(
        { id: modalRecord.id, payload: values },
        {
          onSuccess: () => {
            message.success(`${title} updated.`);
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, `Unable to update ${title.toLowerCase()}.`));
          },
        },
      );
    }
  };

  const handleDelete = (record: T) => {
    confirm({
      title: `Remove "${recordLabel(record)}"?`,
      okText: 'Remove',
      danger: true,
      onConfirm: () =>
        removeMutation.mutate(record.id, {
          onSuccess: () => message.success(`${title} removed.`),
          onError: (error) => message.error(getErrorMessage(error, `Unable to remove ${title.toLowerCase()}.`)),
        }),
    });
  };

  const tableColumns: ColumnsType<T> = [
    ...columns,
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, record) => (
        <ActionMenu
          items={[
            ...(enableEdit ? [{ key: 'edit', label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(record) }] : []),
            { key: 'delete', label: 'Remove', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(record) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="small" type="primary" icon={<Plus size={14} />} onClick={openCreate}>
          Add
        </Button>
      </div>
      <DataTable<T>
        columns={tableColumns}
        data={listQuery.data?.data}
        rowKey="id"
        loading={listQuery.isLoading}
        error={listQuery.error}
        onRetry={() => listQuery.refetch()}
        emptyTitle={`No ${title.toLowerCase()} recorded`}
        emptyActionLabel="Add"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? `Add ${title}` : `Edit ${title}`}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </div>
  );
}
