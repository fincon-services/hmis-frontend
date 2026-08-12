import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, InputNumber } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StatCard } from '@/components/common/StatCard';
import { useFeedback } from '@/hooks/useFeedback';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { apiClient } from '@/api/client';
import { useLeaveTypes } from './LeaveTypesPage';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z.object({
  employee_id: z.number().optional(),
  leave_type_id: z.number({ required_error: 'Required' }),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  is_half_day: z.boolean(),
  no_of_days: z.number({ required_error: 'Required' }).min(0),
  is_unpaid: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function LeaveApplicationPage() {
  const { message } = useFeedback();
  const leaveTypesQuery = useLeaveTypes({ per_page: 0 });
  const leaveTypeOptions = useMemo(() => (leaveTypesQuery.data?.data ?? []).map((t) => ({ label: t.name, value: t.id })), [leaveTypesQuery.data]);

  const [submitting, setSubmitting] = useState(false);
  const [summaryEmployeeId, setSummaryEmployeeId] = useState<number>();
  const [summaryLeaveType, setSummaryLeaveType] = useState<number>();
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<{ used_days: number; entitled_days: number } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fields: FieldConfig<FormValues>[] = [
    { type: 'number', name: 'employee_id', label: 'Employee ID', helpText: 'Leave blank to apply for your own linked employee record' },
    { type: 'select', name: 'leave_type_id', label: 'Leave Type', required: true, options: leaveTypeOptions },
    { type: 'text', name: 'start_date', label: 'Start Date (YYYY-MM-DD)', required: true },
    { type: 'text', name: 'end_date', label: 'End Date (YYYY-MM-DD)', required: true },
    { type: 'number', name: 'no_of_days', label: 'Number of Days', required: true, min: 0 },
    { type: 'switch', name: 'is_half_day', label: 'Half Day' },
    { type: 'switch', name: 'is_unpaid', label: 'Unpaid' },
  ];

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { is_half_day: false, is_unpaid: false, no_of_days: 1 } });

  const onSubmit = (values: FormValues) => {
    setSubmitting(true);
    apiClient
      .post('/leave/applications', values, { screenKey: 'leave.applications' })
      .then(() => {
        message.success('Leave application submitted.');
        reset({ is_half_day: false, is_unpaid: false, no_of_days: 1 });
      })
      .catch((error) => {
        if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to submit leave application.'));
      })
      .finally(() => setSubmitting(false));
  };

  const onLookupSummary = () => {
    if (!summaryEmployeeId || !summaryLeaveType) {
      message.error('Employee ID and leave type are required.');
      return;
    }
    setSummaryLoading(true);
    apiClient
      .get<{ used_days: number; entitled_days: number }>('/leave/applications/summary', {
        params: { employee_id: summaryEmployeeId, leave_type_id: summaryLeaveType, year: summaryYear },
        screenKey: 'leave.applications',
      })
      .then((r) => setSummary(r.data))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load leave application data.')))
      .finally(() => setSummaryLoading(false));
  };

  return (
    <PageContainer>
      <PageHeader title="Leave Application" breadcrumbs={[{ label: 'HR' }, { label: 'Leave' }, { label: 'Apply' }]} />

      <SectionCard title="Submit Leave Application">
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
          <GeneratedForm fields={fields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit Application
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Leave Balance Summary">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <InputNumber placeholder="Employee ID" value={summaryEmployeeId} onChange={(v) => setSummaryEmployeeId(v ?? undefined)} min={1} />
          <InputNumber placeholder="Leave Type ID" value={summaryLeaveType} onChange={(v) => setSummaryLeaveType(v ?? undefined)} min={1} />
          <InputNumber placeholder="Year" value={summaryYear} onChange={(v) => setSummaryYear(v ?? summaryYear)} min={2000} />
          <Button type="primary" onClick={onLookupSummary} loading={summaryLoading}>
            Look Up
          </Button>
        </div>
        {summary && (
          <div style={{ display: 'flex', gap: 16 }}>
            <StatCard label="Used Days" value={summary.used_days} />
            <StatCard label="Entitled Days" value={summary.entitled_days} />
            <StatCard label="Remaining" value={summary.entitled_days - summary.used_days} />
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
