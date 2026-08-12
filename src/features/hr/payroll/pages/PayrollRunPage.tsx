import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, InputNumber, Switch, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useConfirm } from '@/hooks/useConfirm';
import { apiClient } from '@/api/client';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { useEmploymentStatuses } from '@/features/administration/hr-setup/employment-statuses/EmploymentStatusesPage';
import type { CollectionResponse } from '@/types/api';

const SCREEN_GENERATE = 'payroll.generate';
const SCREEN_APPROVE = 'payroll.approve';
const SCREEN_BANK = 'payroll.bank-export';

interface PreviewRow {
  employee_id: number;
  employee_code: string;
  name: string;
  gross_salary: number;
  tax_amount: number;
  total_deductions: number;
  net_salary: number;
}
interface PreviewResponse {
  data: PreviewRow[];
  totals: { gross_salary: number; tax_amount: number; total_deductions: number; net_salary: number };
}

interface PayrollTotal {
  id: number;
  employment_status_id: number;
  month: number;
  year: number;
  net_salary: number;
  total_tax: number;
  generated_at: string;
  is_approved: boolean;
}

interface BankExportRow {
  employee_code: string;
  name: string;
  bank_name: string | null;
  branch_code: string | null;
  account_number: string | null;
  net_salary: number;
}

export function PayrollRunPage() {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const employmentStatusesQuery = useEmploymentStatuses({ per_page: 0 });

  const [statusId, setStatusId] = useState<number>();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [includeArrears, setIncludeArrears] = useState(false);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [totalsStatus, setTotalsStatus] = useState<'pending' | 'approved'>('pending');
  const totalsQuery = useQuery({
    queryKey: ['payroll-totals', totalsStatus],
    queryFn: () => apiClient.get<{ data: PayrollTotal[] }>('/payroll/totals', { params: { status: totalsStatus }, screenKey: SCREEN_APPROVE }).then((r) => r.data.data),
  });

  const [paymentType, setPaymentType] = useState('bank');
  const [bankRows, setBankRows] = useState<BankExportRow[] | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [markingPosted, setMarkingPosted] = useState(false);

  const employmentStatusOptions = (employmentStatusesQuery.data?.data ?? []).map((s) => ({ label: s.name, value: s.id }));

  const onPreview = () => {
    if (!statusId) {
      message.error('Select an employment status.');
      return;
    }
    setPreviewLoading(true);
    apiClient
      .get<PreviewResponse>('/payroll/preview', { params: { employment_status_id: statusId, month, year, include_arrears: includeArrears }, screenKey: SCREEN_GENERATE })
      .then((r) => setPreview(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load payroll preview.')))
      .finally(() => setPreviewLoading(false));
  };

  const onGenerate = () => {
    if (!statusId) {
      message.error('Select an employment status.');
      return;
    }
    confirm({
      title: `Generate payroll for ${month}/${year}?`,
      content: 'This persists payroll for every employee in the selected status group and replaces any existing generation for this month.',
      okText: 'Generate',
      onConfirm: () => {
        setGenerating(true);
        apiClient
          .post('/payroll/generate', { employment_status_id: statusId, month, year, include_arrears: includeArrears }, { screenKey: SCREEN_GENERATE })
          .then(() => {
            message.success('Payroll generated.');
            totalsQuery.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to generate payroll.')))
          .finally(() => setGenerating(false));
      },
    });
  };

  const onApprove = (total: PayrollTotal) => {
    confirm({
      title: `Approve payroll batch for ${total.month}/${total.year}?`,
      okText: 'Approve',
      onConfirm: () =>
        apiClient
          .post(`/payroll/totals/${total.id}/approve`, undefined, { screenKey: SCREEN_APPROVE })
          .then(() => {
            message.success('Payroll approved.');
            totalsQuery.refetch();
          })
          .catch((error) => message.error(getErrorMessage(error, 'Unable to approve payroll.'))),
    });
  };

  const onBankExport = () => {
    if (!statusId) {
      message.error('Select an employment status.');
      return;
    }
    setBankLoading(true);
    apiClient
      .get<CollectionResponse<BankExportRow>>('/payroll/bank-export', { params: { payment_type: paymentType, employment_status_id: statusId, month, year }, screenKey: SCREEN_BANK })
      .then((r) => setBankRows(r.data.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load bank export.')))
      .finally(() => setBankLoading(false));
  };

  const onMarkPosted = () => {
    if (!statusId) return;
    confirm({
      title: 'Mark this batch as posted to bank?',
      okText: 'Mark Posted',
      onConfirm: () => {
        setMarkingPosted(true);
        apiClient
          .post('/payroll/bank-export/mark-posted', { employment_status_id: statusId, month, year }, { screenKey: SCREEN_BANK })
          .then(() => message.success('Payroll batch marked as posted to bank.'))
          .catch((error) => message.error(getErrorMessage(error, 'Unable to mark payroll as posted.')))
          .finally(() => setMarkingPosted(false));
      },
    });
  };

  const previewColumns: ColumnsType<PreviewRow> = [
    { title: 'Code', dataIndex: 'employee_code', width: 110 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Gross', dataIndex: 'gross_salary', width: 110 },
    { title: 'Tax', dataIndex: 'tax_amount', width: 100 },
    { title: 'Deductions', dataIndex: 'total_deductions', width: 110 },
    { title: 'Net', dataIndex: 'net_salary', width: 110 },
  ];

  const totalsColumns: ColumnsType<PayrollTotal> = [
    { title: 'Status Group', dataIndex: 'employment_status_id', width: 120 },
    { title: 'Month/Year', key: 'my', render: (_, r) => `${r.month}/${r.year}` },
    { title: 'Net Salary', dataIndex: 'net_salary', width: 130 },
    { title: 'Total Tax', dataIndex: 'total_tax', width: 110 },
    { title: 'Status', dataIndex: 'is_approved', width: 120, render: (v: boolean) => <StatusBadge label={v ? 'Approved' : 'Pending'} tone={v ? 'success' : 'warning'} /> },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (!record.is_approved ? <Button size="small" onClick={() => onApprove(record)}>Approve</Button> : null),
    },
  ];

  const bankColumns: ColumnsType<BankExportRow> = [
    { title: 'Code', dataIndex: 'employee_code', width: 110 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Bank', dataIndex: 'bank_name', render: (v: string | null) => v ?? '—' },
    { title: 'Branch', dataIndex: 'branch_code', render: (v: string | null) => v ?? '—' },
    { title: 'Account', dataIndex: 'account_number', render: (v: string | null) => v ?? '—' },
    { title: 'Net Salary', dataIndex: 'net_salary', width: 120 },
  ];

  return (
    <PageContainer>
      <PageHeader title="Payroll Run" breadcrumbs={[{ label: 'HR' }, { label: 'Payroll' }, { label: 'Run' }]} />

      <SectionCard title="Preview & Generate">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <Select style={{ width: 200 }} placeholder="Employment Status" options={employmentStatusOptions} value={statusId} onChange={setStatusId} />
          <InputNumber placeholder="Month" value={month} onChange={(v) => setMonth(v ?? 1)} min={1} max={12} />
          <InputNumber placeholder="Year" value={year} onChange={(v) => setYear(v ?? year)} min={2000} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch checked={includeArrears} onChange={setIncludeArrears} /> <span style={{ fontSize: 13 }}>Include Arrears</span>
          </div>
          <Button onClick={onPreview} loading={previewLoading}>
            Preview
          </Button>
          <Button type="primary" onClick={onGenerate} loading={generating}>
            Generate
          </Button>
        </div>

        {preview && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <StatCard label="Gross" value={preview.totals.gross_salary} />
              <StatCard label="Tax" value={preview.totals.tax_amount} />
              <StatCard label="Deductions" value={preview.totals.total_deductions} />
              <StatCard label="Net" value={preview.totals.net_salary} />
            </div>
            <Table<PreviewRow> columns={previewColumns} dataSource={preview.data} rowKey="employee_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Payroll Totals & Approval">
        <div style={{ marginBottom: 12 }}>
          <Select
            style={{ width: 160 }}
            value={totalsStatus}
            onChange={setTotalsStatus}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
            ]}
          />
        </div>
        {totalsQuery.isLoading ? <LoadingState rows={2} /> : <Table<PayrollTotal> columns={totalsColumns} dataSource={totalsQuery.data} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
      </SectionCard>

      <SectionCard title="Bank Export">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <Select
            style={{ width: 140 }}
            value={paymentType}
            onChange={setPaymentType}
            options={[
              { label: 'Bank', value: 'bank' },
              { label: 'Cash', value: 'cash' },
              { label: 'Cheque', value: 'cheque' },
            ]}
          />
          <Button onClick={onBankExport} loading={bankLoading}>
            Export
          </Button>
          <Button danger onClick={onMarkPosted} loading={markingPosted}>
            Mark Posted
          </Button>
        </div>
        {bankRows && <Table<BankExportRow> columns={bankColumns} dataSource={bankRows} rowKey="employee_code" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
      </SectionCard>
    </PageContainer>
  );
}
