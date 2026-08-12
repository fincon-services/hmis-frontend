import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader, type BreadcrumbItem } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Can } from '@/app/guards/PermissionGuard';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { useDebounce } from '@/hooks/useDebounce';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { isPaginated } from '@/types/api';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type { createCrudHooks } from './createCrudHooks';

interface RecordBase {
  id: number;
}

export interface CrudResourceConfig<T extends RecordBase, F extends FieldValues> {
  title: string;
  /** Singular form of `title` for button/modal/message text (e.g. "Currency" for "Currencies") — trailing-`s` stripping breaks on words like "Currencies" or "Categories". */
  singularTitle: string;
  /** One-line subtitle under the page title (see PageHeader). Falls back to a generic "Manage {title}." if omitted, so every page still states what the user is doing. */
  description?: string;
  screenKey: string;
  breadcrumbs: BreadcrumbItem[];
  columns: ColumnsType<T>;
  fields: FieldConfig<F>[];
  schema: ZodType<F>;
  defaultValues: F;
  toFormValues: (record: T) => F;
  recordLabel: (record: T) => string;
  hooks: ReturnType<typeof createCrudHooks<T, F, F>>;
  hasIsActiveFilter?: boolean;
  addButtonLabel?: string;
  searchPlaceholder?: string;
  /** Set false when the API has no `delete-bulk` route for this resource (e.g. vital types). Defaults true. */
  enableBulkDelete?: boolean;
  /** Set false when the API has no update route for this resource (e.g. surgical statistics — index/store/destroy only). Defaults true. */
  enableEdit?: boolean;
  /** Extra items appended to each row's action menu, before Edit/Delete (e.g. "Manage Parameters"). */
  extraRowActions?: (record: T) => { key: string; label: string; icon?: React.ReactNode; onClick: () => void }[];
}

export function CrudResourcePage<T extends RecordBase, F extends FieldValues>(config: CrudResourceConfig<T, F>) {
  const { title, singularTitle, description, screenKey, breadcrumbs, columns, fields, schema, defaultValues, toFormValues, recordLabel, hooks, hasIsActiveFilter, addButtonLabel, searchPlaceholder, enableBulkDelete = true, enableEdit = true, extraRowActions } = config;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ field?: string; direction?: 'asc' | 'desc' }>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalRecord, setModalRecord] = useState<T | 'new' | null>(null);

  const { message } = useFeedback();
  const confirm = useConfirm();

  const listQuery = hooks.useList({
    search: debouncedSearch || undefined,
    is_active: isActiveFilter,
    sort: sort.field,
    direction: sort.direction,
    per_page: pageSize,
    page,
  });
  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const removeMutation = hooks.useRemove();
  const removeBulkMutation = hooks.useRemoveBulk();

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

  const closeModal = () => setModalRecord(null);

  const onSubmit = (values: F) => {
    if (modalRecord === 'new') {
      createMutation.mutate(values, {
        onSuccess: () => {
          message.success(`${singularTitle} created successfully.`);
          closeModal();
        },
        onError: (error) => {
          const handled = applyServerValidationErrors(error, setError);
          if (!handled) message.error(getErrorMessage(error, `Unable to save ${title.toLowerCase()}.`));
        },
      });
    } else if (modalRecord) {
      updateMutation.mutate(
        { id: modalRecord.id, payload: values },
        {
          onSuccess: () => {
            message.success(`${singularTitle} updated successfully.`);
            closeModal();
          },
          onError: (error) => {
            const handled = applyServerValidationErrors(error, setError);
            if (!handled) message.error(getErrorMessage(error, `Unable to save ${title.toLowerCase()}.`));
          },
        },
      );
    }
  };

  const handleDelete = (record: T) => {
    confirm({
      title: `Delete "${recordLabel(record)}"?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        removeMutation.mutate(record.id, {
          onSuccess: () => message.success(`${singularTitle} deleted.`),
          onError: (error) => message.error(getErrorMessage(error, `Unable to delete ${singularTitle.toLowerCase()}.`)),
        }),
    });
  };

  const handleBulkDelete = () => {
    confirm({
      title: `Delete ${selectedIds.length} selected record(s)?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        removeBulkMutation.mutate(selectedIds, {
          onSuccess: () => {
            message.success('Selected records deleted.');
            setSelectedIds([]);
          },
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete selected records.')),
        }),
    });
  };

  const data = listQuery.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const tableColumns: ColumnsType<T> = [
    ...columns,
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, record) => (
        <ActionMenu
          items={[
            ...(extraRowActions?.(record) ?? []),
            ...(enableEdit ? [{ key: 'edit', label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(record) }] : []),
            { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(record) },
          ]}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description ?? `Manage ${title.toLowerCase()}.`}
        breadcrumbs={breadcrumbs}
        extra={
          <Can screen={screenKey}>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              {addButtonLabel ?? `Add ${singularTitle}`}
            </Button>
          </Can>
        }
      />

      <DataTable<T>
        columns={tableColumns}
        data={rows}
        rowKey="id"
        loading={listQuery.isLoading}
        error={listQuery.error}
        onRetry={() => listQuery.refetch()}
        meta={meta}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onSortChange={({ field, order }) => setSort({ field, direction: order })}
        rowSelection={
          enableBulkDelete
            ? {
                selectedRowKeys: selectedIds,
                onChange: (keys) => setSelectedIds(keys as number[]),
              }
            : undefined
        }
        selectedCount={enableBulkDelete ? selectedIds.length : 0}
        bulkActions={
          <Button danger size="small" icon={<Trash2 size={14} />} onClick={handleBulkDelete}>
            Delete selected
          </Button>
        }
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`} />
            {hasIsActiveFilter && (
              <Select
                allowClear
                placeholder="Status"
                style={{ width: 140 }}
                value={isActiveFilter}
                onChange={setIsActiveFilter}
                options={[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ]}
              />
            )}
          </FilterBar>
        }
        emptyTitle={`No ${title.toLowerCase()} found`}
        emptyDescription="Try changing your search criteria or create a new record."
        emptyActionLabel={addButtonLabel ?? `Add ${singularTitle}`}
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? `Add ${singularTitle}` : `Edit ${singularTitle}`}
        open={modalRecord !== null}
        onCancel={closeModal}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
