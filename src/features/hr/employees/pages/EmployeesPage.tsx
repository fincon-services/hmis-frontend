import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserPlus, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StatusBadge, activeStatusTone } from '@/components/common/StatusBadge';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useEmployees, useCreateEmployee } from '../hooks/useEmployees';
import { employeeApi } from '../api/employeeApi';
import { queryClient } from '@/api/queryClient';
import { isPaginated } from '@/types/api';
import type { Employee } from '../types/employee.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  employee_code: z.string().min(1, 'Required').max(50),
  first_name: z.string().min(1, 'Required').max(100),
  middle_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Required').max(100),
  cnic: z.string().min(1, 'Required').max(20),
});
type FormValues = z.infer<typeof schema>;

const fields: FieldConfig<FormValues>[] = [
  { type: 'text', name: 'employee_code', label: 'Employee Code', required: true, placeholder: 'EMP-1001' },
  { type: 'text', name: 'first_name', label: 'First Name', required: true },
  { type: 'text', name: 'middle_name', label: 'Middle Name' },
  { type: 'text', name: 'last_name', label: 'Last Name', required: true },
  { type: 'text', name: 'cnic', label: 'CNIC', required: true, placeholder: '12345-1234567-1' },
];

const columns: ColumnsType<Employee> = [
  { title: 'Code', dataIndex: 'employee_code', width: 110 },
  { title: 'Name', dataIndex: 'full_name' },
  { title: 'Department', key: 'department', render: (_, r) => r.department?.name ?? '—' },
  { title: 'Job Title', key: 'job_title', render: (_, r) => r.job_title?.name ?? '—' },
  { title: 'Status', dataIndex: 'employment_status', key: 'status', render: (_, r) => r.employment_status?.name ?? '—' },
  {
    title: 'Active',
    dataIndex: 'is_active',
    width: 100,
    render: (v: boolean) => <StatusBadge label={v ? 'Active' : 'Inactive'} tone={activeStatusTone(v)} />,
  },
];

export function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const { message } = useFeedback();
  const confirm = useConfirm();
  const query = useEmployees({ search: debouncedSearch || undefined, is_active: isActive, per_page: pageSize, page });
  const createEmployee = useCreateEmployee();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const openCreate = () => {
    reset({ employee_code: '', first_name: '', middle_name: '', last_name: '', cnic: '' });
    setModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    createEmployee.mutate(
      { ...values, middle_name: values.middle_name || undefined },
      {
        onSuccess: (employee) => {
          message.success('Employee created.');
          setModalOpen(false);
          navigate(`/hr/employees/${employee.id}`);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to create employee.'));
        },
      },
    );
  };

  const handleDelete = (record: Employee) => {
    confirm({
      title: `Delete "${record.full_name}"?`,
      okText: 'Delete',
      danger: true,
      onConfirm: () =>
        employeeApi
          .remove(record.id)
          .then(() => {
            message.success('Employee deleted.');
            queryClient.invalidateQueries({ queryKey: ['employees', 'list'] });
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to delete employee.'))),
    });
  };

  const tableColumns: ColumnsType<Employee> = [
    ...columns,
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, record) => (
        <ActionMenu items={[{ key: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(record) }]} />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        breadcrumbs={[{ label: 'HR' }, { label: 'Employees' }]}
        extra={
          <Button type="primary" icon={<UserPlus size={16} />} onClick={openCreate}>
            Add Employee
          </Button>
        }
      />

      <DataTable<Employee>
        columns={tableColumns}
        data={rows}
        rowKey="id"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        meta={meta}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onRowClick={(record) => navigate(`/hr/employees/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, CNIC…" />
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 130 }}
              value={isActive}
              onChange={setIsActive}
              options={[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No employees found"
        emptyActionLabel="Add Employee"
        onEmptyAction={openCreate}
      />

      <FormModal title="Add Employee" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit(onSubmit)} confirmLoading={createEmployee.isPending}>
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
