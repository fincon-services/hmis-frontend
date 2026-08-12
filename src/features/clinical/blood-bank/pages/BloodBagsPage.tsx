import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/tables/DataTable';
import { FormModal } from '@/components/modals/FormModal';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useBloodBags, useReceiveBloodBag } from '../hooks/useBloodBank';
import { isPaginated } from '@/types/api';
import type { BloodBag } from '../types/bloodBank.types';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const schema = z.object({
  blood_group: z.string().min(1, 'Blood group is required'),
  original_quantity: z.number({ required_error: 'Quantity is required' }).min(1),
  donor_name: z.string().max(100).optional().or(z.literal('')),
  donor_cnic: z.string().max(20).optional().or(z.literal('')),
  guardian_name: z.string().max(100).optional().or(z.literal('')),
  guardian_phone: z.string().max(20).optional().or(z.literal('')),
  bag_number: z.string().max(50).optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  is_pre_screened: z.boolean().optional(),
  remarks: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

const fields: FieldConfig<FormValues>[] = [
  { type: 'section', label: 'Bag Details' },
  { type: 'select', name: 'blood_group', label: 'Blood Group', required: true, options: BLOOD_GROUPS.map((g) => ({ label: g, value: g })) },
  { type: 'number', name: 'original_quantity', label: 'Quantity (bags)', required: true, min: 1 },
  { type: 'text', name: 'bag_number', label: 'Bag Number' },
  { type: 'text', name: 'expiry_date', label: 'Expiry Date (YYYY-MM-DD)' },
  { type: 'switch', name: 'is_pre_screened', label: 'Pre-screened' },

  { type: 'section', label: 'Donor Details' },
  { type: 'text', name: 'donor_name', label: 'Donor Name' },
  { type: 'text', name: 'donor_cnic', label: 'Donor CNIC' },
  { type: 'text', name: 'guardian_name', label: 'Guardian Name' },
  { type: 'text', name: 'guardian_phone', label: 'Guardian Phone' },
  { type: 'textarea', name: 'remarks', label: 'Remarks' },
];

const columns: ColumnsType<BloodBag> = [
  { title: 'Bag #', dataIndex: 'bag_number', render: (v: string | null) => v ?? '—' },
  { title: 'Blood Group', dataIndex: 'blood_group', width: 110 },
  { title: 'Quantity', key: 'quantity', width: 130, render: (_, r) => `${r.quantity} / ${r.original_quantity}` },
  { title: 'Donor', dataIndex: 'donor_name', render: (v: string | null) => v ?? '—' },
  {
    title: 'Screening',
    dataIndex: 'is_screening_cleared',
    width: 130,
    render: (v: boolean) => <StatusBadge label={v ? 'Cleared' : 'Pending'} tone={v ? 'success' : 'warning'} />,
  },
  { title: 'Expiry', dataIndex: 'expiry_date', render: (v: string | null) => v ?? '—' },
];

export function BloodBagsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [bloodGroup, setBloodGroup] = useState<string | undefined>();
  const [available, setAvailable] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);

  const { message } = useFeedback();
  const query = useBloodBags({ search: debouncedSearch || undefined, blood_group: bloodGroup, available, per_page: pageSize, page });
  const receive = useReceiveBloodBag();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { is_pre_screened: false } });

  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  const openCreate = () => {
    reset({ blood_group: '', original_quantity: 1, is_pre_screened: false });
    setModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    receive.mutate(
      {
        blood_group: values.blood_group,
        original_quantity: values.original_quantity,
        donor_name: values.donor_name || undefined,
        donor_cnic: values.donor_cnic || undefined,
        guardian_name: values.guardian_name || undefined,
        guardian_phone: values.guardian_phone || undefined,
        bag_number: values.bag_number || undefined,
        expiry_date: values.expiry_date || undefined,
        is_pre_screened: values.is_pre_screened,
        remarks: values.remarks || undefined,
      },
      {
        onSuccess: () => {
          message.success('Blood bag received into inventory.');
          setModalOpen(false);
        },
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to receive blood bag.'));
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Blood Bags"
        breadcrumbs={[{ label: 'Clinical' }, { label: 'Blood Bank' }, { label: 'Inventory' }]}
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Receive Blood
          </Button>
        }
      />

      <DataTable<BloodBag>
        columns={columns}
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
        onRowClick={(record) => navigate(`/blood-bank/bags/${record.id}`)}
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search donor, CNIC, bag #…" />
            <Select allowClear placeholder="Blood Group" style={{ width: 130 }} value={bloodGroup} onChange={setBloodGroup} options={BLOOD_GROUPS.map((g) => ({ label: g, value: g }))} />
            <Select
              allowClear
              placeholder="Availability"
              style={{ width: 150 }}
              value={available}
              onChange={setAvailable}
              options={[{ label: 'Available only', value: true }]}
            />
          </FilterBar>
        }
        emptyTitle="No blood bags found"
        emptyActionLabel="Receive Blood"
        onEmptyAction={openCreate}
      />

      <FormModal title="Receive Blood Bag" open={modalOpen} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit(onSubmit)} confirmLoading={receive.isPending} width={600}>
        <GeneratedForm fields={fields} control={control} errors={errors} />
      </FormModal>
    </PageContainer>
  );
}
