import { useMemo, useState } from 'react';
import { Tabs, Table, DatePicker, Select, Button, Statistic, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { apiClient } from '@/api/client';
import { useChartAccountsPlain } from './ChartAccountsPage';
import type { CollectionResponse } from '@/types/api';
import type { Voucher } from './VouchersPage';

const SCREEN = 'finance.reports';

interface AccountBalanceRow {
  account_id: number;
  account_name: string;
  account_code: string | null;
  account_type: string;
  debit_amount: number;
  credit_amount: number;
}

interface LedgerEntryRow {
  id: number;
  finance_voucher_id: number;
  voucher_no: string | null;
  finance_chart_account_id: number;
  account_name: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  entry_date: string;
}

const balanceColumns: ColumnsType<AccountBalanceRow> = [
  { title: 'Account', dataIndex: 'account_name' },
  { title: 'Code', dataIndex: 'account_code', width: 100, render: (v: string | null) => v ?? '—' },
  { title: 'Type', dataIndex: 'account_type', width: 110 },
  { title: 'Debit', dataIndex: 'debit_amount', width: 120 },
  { title: 'Credit', dataIndex: 'credit_amount', width: 120 },
];

function useDateRange() {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  return { range, setRange, params: range ? { date_from: range[0].format('YYYY-MM-DD'), date_to: range[1].format('YYYY-MM-DD') } : null };
}

function TrialBalanceTab() {
  const { range, setRange, params } = useDateRange();
  const [rows, setRows] = useState<AccountBalanceRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<AccountBalanceRow[]>('/finance/reports/trial-balance', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
          Run
        </Button>
      </div>
      {rows && <Table<AccountBalanceRow> columns={balanceColumns} dataSource={rows} rowKey="account_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

function BalanceSheetTab() {
  const { range, setRange, params } = useDateRange();
  const [result, setResult] = useState<{ assets: AccountBalanceRow[]; total_assets: number; liabilities: AccountBalanceRow[]; total_liabilities: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<{ assets: AccountBalanceRow[]; total_assets: number; liabilities: AccountBalanceRow[]; total_liabilities: number }>('/finance/reports/balance-sheet', {
        params,
        screenKey: SCREEN,
      })
      .then((r) => setResult(r.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
          Run
        </Button>
      </div>
      {result && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Statistic title="Total Assets" value={result.total_assets} precision={2} />
            </Col>
            <Col span={12}>
              <Statistic title="Total Liabilities" value={result.total_liabilities} precision={2} />
            </Col>
          </Row>
          <h4>Assets</h4>
          <Table<AccountBalanceRow> columns={balanceColumns} dataSource={result.assets} rowKey="account_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />
          <h4 style={{ marginTop: 16 }}>Liabilities</h4>
          <Table<AccountBalanceRow> columns={balanceColumns} dataSource={result.liabilities} rowKey="account_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />
        </>
      )}
    </div>
  );
}

function ProfitAndLossTab() {
  const { range, setRange, params } = useDateRange();
  const [result, setResult] = useState<{ income: AccountBalanceRow[]; total_income: number; expense: AccountBalanceRow[]; total_expense: number; net_profit: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<{ income: AccountBalanceRow[]; total_income: number; expense: AccountBalanceRow[]; total_expense: number; net_profit: number }>('/finance/reports/profit-and-loss', {
        params,
        screenKey: SCREEN,
      })
      .then((r) => setResult(r.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
          Run
        </Button>
      </div>
      {result && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic title="Total Income" value={result.total_income} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Total Expense" value={result.total_expense} precision={2} />
            </Col>
            <Col span={8}>
              <Statistic title="Net Profit" value={result.net_profit} precision={2} valueStyle={{ color: result.net_profit >= 0 ? '#2e7d4f' : '#c0392b' }} />
            </Col>
          </Row>
          <h4>Income</h4>
          <Table<AccountBalanceRow> columns={balanceColumns} dataSource={result.income} rowKey="account_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />
          <h4 style={{ marginTop: 16 }}>Expense</h4>
          <Table<AccountBalanceRow> columns={balanceColumns} dataSource={result.expense} rowKey="account_id" size="small" pagination={false} scroll={{ x: 'max-content' }} />
        </>
      )}
    </div>
  );
}

function GeneralJournalTab() {
  const { range, setRange, params } = useDateRange();
  const [rows, setRows] = useState<Voucher[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params) return;
    setLoading(true);
    apiClient
      .get<CollectionResponse<Voucher>>('/finance/reports/general-journal', { params, screenKey: SCREEN })
      .then((r) => setRows(r.data.data))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<Voucher> = [
    { title: 'Voucher No.', dataIndex: 'voucher_no', render: (v: string | null) => v ?? '—' },
    { title: 'Type', dataIndex: 'type', width: 140 },
    { title: 'Date', dataIndex: 'voucher_date', width: 140 },
    { title: 'Narration', dataIndex: 'narration', render: (v: string | null) => v ?? '—' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range}>
          Run
        </Button>
      </div>
      {rows && <Table<Voucher> columns={columns} dataSource={rows} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

function LedgerSummaryTab() {
  const { range, setRange, params } = useDateRange();
  const accountsQuery = useChartAccountsPlain({ per_page: 0 });
  const accountOptions = useMemo(() => (accountsQuery.data?.data ?? []).map((a) => ({ label: a.name, value: a.id })), [accountsQuery.data]);
  const [accountId, setAccountId] = useState<number>();
  const [rows, setRows] = useState<LedgerEntryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onRun = () => {
    if (!params || !accountId) return;
    setLoading(true);
    apiClient
      .get<CollectionResponse<LedgerEntryRow>>('/finance/reports/ledger-summary', { params: { ...params, chart_account_id: accountId }, screenKey: SCREEN })
      .then((r) => setRows(r.data.data))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<LedgerEntryRow> = [
    { title: 'Voucher No.', dataIndex: 'voucher_no', render: (v: string | null) => v ?? '—' },
    { title: 'Date', dataIndex: 'entry_date', width: 140 },
    { title: 'Debit', dataIndex: 'debit_amount', width: 120, render: (v: number | null) => v ?? 0 },
    { title: 'Credit', dataIndex: 'credit_amount', width: 120, render: (v: number | null) => v ?? 0 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select style={{ width: 240 }} placeholder="Chart Account" options={accountOptions} value={accountId} onChange={setAccountId} showSearch optionFilterProp="label" />
        <DatePicker.RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)} />
        <Button type="primary" onClick={onRun} loading={loading} disabled={!range || !accountId}>
          Run
        </Button>
      </div>
      {rows && <Table<LedgerEntryRow> columns={columns} dataSource={rows} rowKey="id" size="small" pagination={false} scroll={{ x: 'max-content' }} />}
    </div>
  );
}

export function FinanceReportsPage() {
  return (
    <PageContainer>
      <PageHeader title="Finance Reports" breadcrumbs={[{ label: 'Finance' }, { label: 'Reports' }]} />
      <Tabs
        items={[
          { key: 'trial-balance', label: 'Trial Balance', children: <TrialBalanceTab /> },
          { key: 'balance-sheet', label: 'Balance Sheet', children: <BalanceSheetTab /> },
          { key: 'profit-and-loss', label: 'Profit & Loss', children: <ProfitAndLossTab /> },
          { key: 'general-journal', label: 'General Journal', children: <GeneralJournalTab /> },
          { key: 'ledger-summary', label: 'Ledger Summary', children: <LedgerSummaryTab /> },
        ]}
      />
    </PageContainer>
  );
}
