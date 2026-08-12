import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserPlus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { Can } from '@/app/guards/PermissionGuard';
import { useDebounce } from '@/hooks/useDebounce';
import { usePatients } from '../hooks/usePatients';
import { isPaginated } from '@/types/api';
import { formatPatientAge, type Patient, type PatientAge, type Origin } from '../types/patient.types';

const columns: ColumnsType<Patient> = [
  { title: 'MR No.', dataIndex: 'mr_no', width: 110 },
  { title: 'Name', dataIndex: 'name' },
  { title: 'Gender', dataIndex: 'gender', width: 90, render: (v: string) => (v === 'male' ? 'Male' : 'Female') },
  { title: 'Age', dataIndex: 'age', width: 90, render: (age: PatientAge) => formatPatientAge(age) },
  { title: 'Guardian', dataIndex: 'guardian_name' },
  { title: 'Guardian Phone', dataIndex: 'guardian_phone', width: 140 },
  {
    title: 'Origin',
    dataIndex: 'origin',
    width: 90,
    render: (v: Origin) => <StatusBadge label={v} tone={v === 'ER' ? 'error' : 'info'} />,
  },
  { title: 'Registered', dataIndex: 'registration_date', width: 120 },
];

export function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [origin, setOrigin] = useState<Origin | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const query = usePatients({ search: debouncedSearch || undefined, origin, per_page: pageSize, page });
  const data = query.data;
  const rows = data?.data;
  const meta = data && isPaginated(data) ? data.meta : undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        breadcrumbs={[{ label: 'Patients' }]}
        description="Search existing patients or register a new one."
        extra={
          <Can screen="patients.registration">
            <Button type="primary" icon={<UserPlus size={16} />} onClick={() => navigate('/patients/new')}>
              Register Patient
            </Button>
          </Can>
        }
      />

      <DataTable<Patient>
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
        toolbarLeft={
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name, MR#, CNIC, or phone…" />
            <Select
              allowClear
              placeholder="Origin"
              style={{ width: 130 }}
              value={origin}
              onChange={setOrigin}
              options={[
                { label: 'OPD', value: 'OPD' },
                { label: 'ER', value: 'ER' },
              ]}
            />
          </FilterBar>
        }
        emptyTitle="No patients found"
        emptyDescription="Try changing your search criteria or register a new patient."
        emptyActionLabel="Register Patient"
        onEmptyAction={() => navigate('/patients/new')}
        onRowClick={(record) => navigate(`/patients/${record.id}`)}
      />
    </PageContainer>
  );
}
