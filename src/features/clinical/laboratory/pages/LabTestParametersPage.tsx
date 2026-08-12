import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useConfirm } from '@/hooks/useConfirm';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useLabTestParameters, useCreateLabTestParameter, useUpdateLabTestParameter, useDeleteLabTestParameter } from '../hooks/useLabTestParameters';
import type { LabTestParameter } from '../types/laboratory.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type { ColumnsType } from 'antd/es/table';

const schema = z.object({
  parameter_name: z.string().min(1, 'Required').max(100),
  parameter_display_name: z.string().min(1, 'Required').max(150),
  parameter_value: z.string().max(255).optional().or(z.literal('')),
  fixed_val: z.string().max(255).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'parameter_name', label: 'Parameter Key', required: true, placeholder: 'hemoglobin', helpText: 'Internal identifier' },
  { type: 'text', name: 'parameter_display_name', label: 'Display Name', required: true, placeholder: 'Hemoglobin' },
  { type: 'text', name: 'parameter_value', label: 'Reference Range', placeholder: '13.5–17.5 g/dL' },
  { type: 'text', name: 'fixed_val', label: 'Fixed Value' },
];

export function LabTestParametersPage() {
  const { labTestId } = useParams<{ labTestId: string }>();
  const testId = Number(labTestId);
  const location = useLocation();
  const testName = (location.state as { testName?: string } | null)?.testName;
  const { message } = useFeedback();
  const confirm = useConfirm();

  const query = useLabTestParameters(testId);
  const createMutation = useCreateLabTestParameter(testId);
  const updateMutation = useUpdateLabTestParameter(testId);
  const deleteMutation = useDeleteLabTestParameter(testId);

  const [modalRecord, setModalRecord] = useState<LabTestParameter | 'new' | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    reset({ parameter_name: '', parameter_display_name: '', parameter_value: '', fixed_val: '' });
    setModalRecord('new');
  };

  const openEdit = (record: LabTestParameter) => {
    reset({
      parameter_name: record.parameter_name,
      parameter_display_name: record.parameter_display_name,
      parameter_value: record.parameter_value ?? '',
      fixed_val: record.fixed_val ?? '',
    });
    setModalRecord(record);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      lab_test_id: testId,
      parameter_name: values.parameter_name,
      parameter_display_name: values.parameter_display_name,
      parameter_value: values.parameter_value || undefined,
      fixed_val: values.fixed_val || undefined,
    };

    if (modalRecord === 'new') {
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Parameter created.');
          setModalRecord(null);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create parameter.'));
        },
      });
    } else if (modalRecord) {
      updateMutation.mutate(
        { id: modalRecord.id, payload },
        {
          onSuccess: () => {
            message.success('Parameter updated.');
            setModalRecord(null);
          },
          onError: (error) => {
            if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update parameter.'));
          },
        },
      );
    }
  };

  const handleDelete = (record: LabTestParameter) => {
    confirm({
      title: `Delete "${record.parameter_display_name}"?`,
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        deleteMutation.mutate(record.id, {
          onSuccess: () => message.success('Parameter deleted.'),
          onError: (error) => message.error(getErrorMessage(error, 'Unable to delete parameter.')),
        }),
    });
  };

  const columns: ColumnsType<LabTestParameter> = [
    { title: 'Display Name', dataIndex: 'parameter_display_name' },
    { title: 'Key', dataIndex: 'parameter_name' },
    { title: 'Reference Range', dataIndex: 'parameter_value', render: (v: string | null) => v ?? '—' },
    { title: 'Fixed Value', dataIndex: 'fixed_val', render: (v: string | null) => v ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, record) => (
        <ActionMenu
          items={[
            { key: 'edit', label: 'Edit', icon: <Pencil size={14} />, onClick: () => openEdit(record) },
            { key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(record) },
          ]}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={testName ? `Parameters — ${testName}` : 'Test Parameters'}
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Laboratory' }, { label: 'Tests', path: '/laboratory/tests' }, { label: 'Parameters' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Add Parameter
          </Button>
        }
      />

      <DataTable<LabTestParameter>
        columns={columns}
        data={query.data}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        emptyTitle="No parameters defined"
        emptyActionLabel="Add Parameter"
        onEmptyAction={openCreate}
      />

      <FormModal
        title={modalRecord === 'new' ? 'Add Parameter' : 'Edit Parameter'}
        open={modalRecord !== null}
        onCancel={() => setModalRecord(null)}
        onSubmit={handleSubmit(onSubmit)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
