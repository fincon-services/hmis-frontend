import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, Button, Select, InputNumber, List, Timeline } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { DetailCard } from '@/components/common/DetailCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { FileUpload } from '@/components/common/FileUpload';
import { InlineSubResourceCrud } from '@/lib/crud/InlineSubResourceCrud';
import { useFeedback } from '@/hooks/useFeedback';
import { useConfirm } from '@/hooks/useConfirm';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useEducationLevels } from '@/features/administration/hr-setup/education-levels/EducationLevelsPage';
import { useJobTitles } from '@/features/administration/hr-setup/job-titles/JobTitlesPage';
import { useJobCategories } from '@/features/administration/hr-setup/job-categories/JobCategoriesPage';
import { useEmploymentStatuses } from '@/features/administration/hr-setup/employment-statuses/EmploymentStatusesPage';
import { useWorkShifts } from '@/features/administration/hr-setup/work-shifts/WorkShiftsPage';
import { usePayGrades } from '@/features/administration/hr-setup/pay-grades/PayGradesPage';
import { useLanguages } from '@/features/administration/hr-setup/languages/LanguagesPage';
import { useSkills } from '@/features/administration/hr-setup/skills/SkillsPage';
import {
  useEmployee,
  useUpdatePersonalDetails,
  useUpdateContactDetails,
  useUpdateJobDetails,
  useUpdateBankDetails,
  useEmployeeSalary,
  useSetSalary,
  useEmployeeWorkShifts,
  useAssignWorkShift,
  useRemoveWorkShift,
  useEmployeeDocuments,
  useDeleteDocument,
  useEmployeeTransfers,
  useRecordTransfer,
  useEmployeePromotions,
  useRecordPromotion,
  useServiceHistory,
} from '../hooks/useEmployees';
import {
  useEmergencyContactHooks,
  useExperienceHooks,
  useQualificationHooks,
  useLanguageHooks,
  useSkillHooks,
  usePostingHooks,
} from '../hooks/useEmployeeSubResources';
import { employeeApi } from '../api/employeeApi';
import type { FieldConfig } from '@/components/forms/FieldConfig';
import type {
  EmergencyContact,
  Experience,
  EmployeeDocument,
  EmployeeLanguage,
  EmployeePosting,
  EmployeeSkill,
  Qualification,
} from '../types/employee.types';
import type { ColumnsType } from 'antd/es/table';

function PersonalTab({ employeeId }: { employeeId: number }) {
  const { data: employee } = useEmployee(employeeId);
  const { message } = useFeedback();
  const educationLevelsQuery = useEducationLevels({ per_page: 0 });
  const update = useUpdatePersonalDetails(employeeId);

  const schema = z.object({
    employee_code: z.string().min(1, 'Required').max(50),
    first_name: z.string().min(1, 'Required').max(100),
    middle_name: z.string().max(100).optional().or(z.literal('')),
    last_name: z.string().min(1, 'Required').max(100),
    cnic: z.string().min(1, 'Required').max(20),
    education_level_id: z.number().optional(),
    gender: z.string().optional().or(z.literal('')),
    marital_status: z.string().optional().or(z.literal('')),
    date_of_birth: z.string().optional().or(z.literal('')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: employee
      ? {
          employee_code: employee.employee_code,
          first_name: employee.first_name,
          middle_name: employee.middle_name ?? '',
          last_name: employee.last_name,
          cnic: employee.cnic,
          education_level_id: employee.education_level?.id,
          gender: employee.gender ?? '',
          marital_status: employee.marital_status ?? '',
          date_of_birth: employee.date_of_birth ?? '',
        }
      : undefined,
  });

  const fields: FieldConfig<FormValues>[] = [
    { type: 'text', name: 'employee_code', label: 'Employee Code', required: true },
    { type: 'text', name: 'first_name', label: 'First Name', required: true },
    { type: 'text', name: 'middle_name', label: 'Middle Name' },
    { type: 'text', name: 'last_name', label: 'Last Name', required: true },
    { type: 'text', name: 'cnic', label: 'CNIC', required: true },
    { type: 'select', name: 'education_level_id', label: 'Education Level', options: (educationLevelsQuery.data?.data ?? []).map((e) => ({ label: e.name, value: e.id })) },
    {
      type: 'select',
      name: 'gender',
      label: 'Gender',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
    },
    { type: 'text', name: 'marital_status', label: 'Marital Status' },
    { type: 'text', name: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)' },
  ];

  const onSubmit = (values: FormValues) => {
    update.mutate(
      { ...values, middle_name: values.middle_name || undefined, gender: values.gender || undefined, marital_status: values.marital_status || undefined, date_of_birth: values.date_of_birth || undefined },
      {
        onSuccess: () => message.success('Personal details updated.'),
        onError: (error) => {
          if (!applyServerValidationErrors(error, setError)) message.error(getErrorMessage(error, 'Unable to update personal details.'));
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
      <GeneratedForm fields={fields} control={control} errors={errors} />
      <Button type="primary" htmlType="submit" loading={update.isPending}>
        Save
      </Button>
    </form>
  );
}

function ContactTab({ employeeId }: { employeeId: number }) {
  const { data: employee } = useEmployee(employeeId);
  const { message } = useFeedback();
  const update = useUpdateContactDetails(employeeId);

  const schema = z.object({
    address_line1: z.string().optional().or(z.literal('')),
    address_line2: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    province: z.string().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),
    postal_code: z.string().optional().or(z.literal('')),
    phone_home: z.string().optional().or(z.literal('')),
    phone_mobile: z.string().optional().or(z.literal('')),
    phone_work: z.string().optional().or(z.literal('')),
    email_work: z.string().email('Invalid email').optional().or(z.literal('')),
    email_personal: z.string().email('Invalid email').optional().or(z.literal('')),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: employee
      ? {
          address_line1: employee.address.line1 ?? '',
          address_line2: employee.address.line2 ?? '',
          city: employee.address.city ?? '',
          province: employee.address.province ?? '',
          country: employee.address.country ?? '',
          postal_code: employee.address.postal_code ?? '',
          phone_home: employee.phone_home ?? '',
          phone_mobile: employee.phone_mobile ?? '',
          phone_work: employee.phone_work ?? '',
          email_work: employee.email_work ?? '',
          email_personal: employee.email_personal ?? '',
        }
      : undefined,
  });

  const fields: FieldConfig<FormValues>[] = [
    { type: 'text', name: 'address_line1', label: 'Address Line 1' },
    { type: 'text', name: 'address_line2', label: 'Address Line 2' },
    { type: 'text', name: 'city', label: 'City' },
    { type: 'text', name: 'province', label: 'Province' },
    { type: 'text', name: 'country', label: 'Country' },
    { type: 'text', name: 'postal_code', label: 'Postal Code' },
    { type: 'text', name: 'phone_home', label: 'Home Phone' },
    { type: 'text', name: 'phone_mobile', label: 'Mobile Phone' },
    { type: 'text', name: 'phone_work', label: 'Work Phone' },
    { type: 'text', name: 'email_work', label: 'Work Email' },
    { type: 'text', name: 'email_personal', label: 'Personal Email' },
  ];

  const onSubmit = (values: FormValues) => {
    const clean = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v || undefined]));
    update.mutate(clean, {
      onSuccess: () => message.success('Contact details updated.'),
      onError: (error) => message.error(getErrorMessage(error, 'Unable to update contact details.')),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
      <GeneratedForm fields={fields} control={control} errors={errors} />
      <Button type="primary" htmlType="submit" loading={update.isPending}>
        Save
      </Button>
    </form>
  );
}

function JobTab({ employeeId }: { employeeId: number }) {
  const { data: employee } = useEmployee(employeeId);
  const { message } = useFeedback();
  const jobTitlesQuery = useJobTitles({ per_page: 0, is_active: true });
  const jobCategoriesQuery = useJobCategories({ per_page: 0, is_active: true });
  const employmentStatusesQuery = useEmploymentStatuses({ per_page: 0 });
  const update = useUpdateJobDetails(employeeId);

  const schema = z.object({
    job_title_id: z.number({ required_error: 'Required' }),
    employment_status_id: z.number({ required_error: 'Required' }),
    job_category_id: z.number({ required_error: 'Required' }),
    department_id: z.number({ required_error: 'Required' }),
    hire_date: z.string().min(1, 'Required'),
    is_active: z.boolean(),
    settlement_amount: z.number().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: employee
      ? {
          job_title_id: employee.job_title?.id ?? (undefined as unknown as number),
          employment_status_id: employee.employment_status?.id ?? (undefined as unknown as number),
          job_category_id: employee.job_category?.id ?? (undefined as unknown as number),
          department_id: employee.department?.id ?? (undefined as unknown as number),
          hire_date: employee.hire_date ?? '',
          is_active: employee.is_active,
        }
      : undefined,
  });

  const fields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'job_title_id', label: 'Job Title', required: true, options: (jobTitlesQuery.data?.data ?? []).map((j) => ({ label: j.name, value: j.id })) },
    { type: 'select', name: 'job_category_id', label: 'Job Category', required: true, options: (jobCategoriesQuery.data?.data ?? []).map((j) => ({ label: j.name, value: j.id })) },
    { type: 'select', name: 'employment_status_id', label: 'Employment Status', required: true, options: (employmentStatusesQuery.data?.data ?? []).map((j) => ({ label: j.name, value: j.id })) },
    {
      type: 'number',
      name: 'department_id',
      label: 'Department ID',
      required: true,
      min: 1,
      helpText: 'The API has no department lookup endpoint — enter the numeric ID directly (see MODULE_MAP.md gap notes).',
    },
    { type: 'text', name: 'hire_date', label: 'Hire Date (YYYY-MM-DD)', required: true },
    { type: 'switch', name: 'is_active', label: 'Active' },
    { type: 'number', name: 'settlement_amount', label: 'Settlement Amount', min: 0, helpText: 'Only used when marking the employee inactive' },
  ];

  const onSubmit = (values: FormValues) => {
    update.mutate(values, {
      onSuccess: () => message.success('Job details updated.'),
      onError: (error) => message.error(getErrorMessage(error, 'Unable to update job details.')),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
      <GeneratedForm fields={fields} control={control} errors={errors} />
      <Button type="primary" htmlType="submit" loading={update.isPending}>
        Save
      </Button>
    </form>
  );
}

function BankTab({ employeeId }: { employeeId: number }) {
  const { data: employee } = useEmployee(employeeId);
  const { message } = useFeedback();
  const update = useUpdateBankDetails(employeeId);

  const schema = z.object({
    payment_type: z.string().min(1, 'Required').max(20),
    bank_account_no: z.string().optional().or(z.literal('')),
    company_bank_account_id: z.number().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: employee ? { payment_type: employee.payment_type ?? '', bank_account_no: employee.bank_account_no ?? '', company_bank_account_id: employee.company_bank_account?.id } : undefined,
  });

  const fields: FieldConfig<FormValues>[] = [
    {
      type: 'select',
      name: 'payment_type',
      label: 'Payment Type',
      required: true,
      options: [
        { label: 'Bank Transfer', value: 'bank' },
        { label: 'Cash', value: 'cash' },
        { label: 'Cheque', value: 'cheque' },
      ],
    },
    { type: 'text', name: 'bank_account_no', label: 'Bank Account Number' },
    { type: 'number', name: 'company_bank_account_id', label: 'Company Bank Account ID', min: 1, helpText: 'No lookup endpoint discovered yet for company bank accounts — enter the ID directly.' },
  ];

  const onSubmit = (values: FormValues) => {
    update.mutate(
      { ...values, bank_account_no: values.bank_account_no || undefined },
      { onSuccess: () => message.success('Bank details updated.'), onError: (error) => message.error(getErrorMessage(error, 'Unable to update bank details.')) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
      <GeneratedForm fields={fields} control={control} errors={errors} />
      <Button type="primary" htmlType="submit" loading={update.isPending}>
        Save
      </Button>
    </form>
  );
}

function SalaryTab({ employeeId }: { employeeId: number }) {
  const { message } = useFeedback();
  const salaryQuery = useEmployeeSalary(employeeId);
  const payGradesQuery = usePayGrades({ per_page: 0, is_active: true });
  const setSalary = useSetSalary(employeeId);

  const schema = z.object({
    pay_grade_id: z.number({ required_error: 'Required' }),
    pay_frequency: z.string().min(1, 'Required'),
    title: z.string().optional().or(z.literal('')),
    basic_salary: z.number({ required_error: 'Required' }).min(0),
    comments: z.string().optional().or(z.literal('')),
    is_attendance_exempt: z.boolean().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: salaryQuery.data
      ? {
          pay_grade_id: salaryQuery.data.pay_grade?.id ?? (undefined as unknown as number),
          pay_frequency: salaryQuery.data.pay_frequency,
          title: salaryQuery.data.title ?? '',
          basic_salary: salaryQuery.data.basic_salary,
          comments: salaryQuery.data.comments ?? '',
          is_attendance_exempt: salaryQuery.data.is_attendance_exempt,
        }
      : { pay_grade_id: undefined as unknown as number, pay_frequency: 'monthly', basic_salary: 0 },
  });

  const fields: FieldConfig<FormValues>[] = [
    { type: 'select', name: 'pay_grade_id', label: 'Pay Grade', required: true, options: (payGradesQuery.data?.data ?? []).map((p) => ({ label: p.name, value: p.id })) },
    {
      type: 'select',
      name: 'pay_frequency',
      label: 'Pay Frequency',
      required: true,
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Daily', value: 'daily' },
      ],
    },
    { type: 'text', name: 'title', label: 'Title' },
    { type: 'number', name: 'basic_salary', label: 'Basic Salary', required: true, min: 0 },
    { type: 'switch', name: 'is_attendance_exempt', label: 'Attendance Exempt' },
    { type: 'textarea', name: 'comments', label: 'Comments' },
  ];

  const onSubmit = (values: FormValues) => {
    setSalary.mutate(
      { ...values, title: values.title || undefined, comments: values.comments || undefined },
      { onSuccess: () => message.success('Salary saved.'), onError: (error) => message.error(getErrorMessage(error, 'Unable to save salary.')) },
    );
  };

  if (salaryQuery.isLoading) return <LoadingState rows={3} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 480 }}>
      <GeneratedForm fields={fields} control={control} errors={errors} />
      <Button type="primary" htmlType="submit" loading={setSalary.isPending}>
        Save Salary
      </Button>
    </form>
  );
}

function WorkShiftsTab({ employeeId }: { employeeId: number }) {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const listQuery = useEmployeeWorkShifts(employeeId);
  const workShiftsQuery = useWorkShifts({ per_page: 0 });
  const assign = useAssignWorkShift(employeeId);
  const remove = useRemoveWorkShift(employeeId);

  const [workShiftId, setWorkShiftId] = useState<number>();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const onAssign = () => {
    if (!workShiftId) {
      message.error('Select a work shift.');
      return;
    }
    assign.mutate(
      { work_shift_id: workShiftId, month, year },
      { onSuccess: () => message.success('Work shift assigned.'), onError: (error) => message.error(getErrorMessage(error, 'Unable to assign work shift.')) },
    );
  };

  const onRemove = (id: number) => {
    confirm({ title: 'Remove this work-shift assignment?', okText: 'Remove', danger: true, onConfirm: () => remove.mutate(id, { onSuccess: () => message.success('Work-shift assignment removed.') }) });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Work Shift</label>
          <Select style={{ width: 200 }} options={(workShiftsQuery.data?.data ?? []).map((w) => ({ label: w.name, value: w.id }))} value={workShiftId} onChange={setWorkShiftId} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Month</label>
          <InputNumber value={month} onChange={(v) => setMonth(v ?? 1)} min={1} max={12} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Year</label>
          <InputNumber value={year} onChange={(v) => setYear(v ?? year)} min={2020} />
        </div>
        <Button type="primary" onClick={onAssign} loading={assign.isPending}>
          Assign
        </Button>
      </div>

      {listQuery.isLoading ? (
        <LoadingState rows={2} />
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="No work-shift assignments" />
      ) : (
        <List
          dataSource={listQuery.data}
          renderItem={(w) => (
            <List.Item actions={[<Button key="remove" size="small" danger onClick={() => onRemove(w.id)}>Remove</Button>]}>
              {w.work_shift_name} — {w.month}/{w.year} {w.month_hours ? `(${w.month_hours}h)` : ''}
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

function DocumentsTab({ employeeId }: { employeeId: number }) {
  const { message } = useFeedback();
  const confirm = useConfirm();
  const listQuery = useEmployeeDocuments(employeeId);
  const deleteMutation = useDeleteDocument(employeeId);
  const [docType, setDocType] = useState('other');
  const [title, setTitle] = useState('');

  const onDownload = (doc: EmployeeDocument) => {
    employeeApi.downloadDocument(employeeId, doc.id, doc.title).catch((error) => message.error(getErrorMessage(error, 'Unable to download document.')));
  };

  const onDelete = (doc: EmployeeDocument) => {
    confirm({ title: `Delete "${doc.title}"?`, okText: 'Delete', danger: true, onConfirm: () => deleteMutation.mutate(doc.id, { onSuccess: () => message.success(`${doc.title} deleted.`) }) });
  };

  return (
    <div>
      <SectionCard title="Upload Document">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Document Type</label>
            <Select
              style={{ width: 180 }}
              value={docType}
              onChange={setDocType}
              options={[
                { label: 'CNIC', value: 'cnic' },
                { label: 'Contract', value: 'contract' },
                { label: 'Certificate', value: 'certificate' },
                { label: 'Other', value: 'other' },
              ]}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '4px 11px', border: '1px solid #d7dde3', borderRadius: 6 }} />
          </div>
        </div>
        <FileUpload
          buttonLabel="Upload"
          onUpload={(file, onProgress) =>
            new Promise<void>((resolve) => {
              if (!title) {
                message.error('Enter a document title.');
                resolve();
                return;
              }
              employeeApi
                .uploadDocument(employeeId, file, docType, title, onProgress)
                .then(() => {
                  message.success('Document uploaded.');
                  listQuery.refetch();
                  setTitle('');
                  resolve();
                })
                .catch((error) => {
                  message.error(getErrorMessage(error, 'Unable to upload document.'));
                  resolve();
                });
            })
          }
        />
      </SectionCard>

      <DataTableDocs data={listQuery.data} loading={listQuery.isLoading} onDownload={onDownload} onDelete={onDelete} />
    </div>
  );
}

function DataTableDocs({
  data,
  loading,
  onDownload,
  onDelete,
}: {
  data: EmployeeDocument[] | undefined;
  loading: boolean;
  onDownload: (doc: EmployeeDocument) => void;
  onDelete: (doc: EmployeeDocument) => void;
}) {
  if (loading) return <LoadingState rows={2} />;
  if ((data?.length ?? 0) === 0) return <EmptyState title="No documents uploaded" />;

  return (
    <List
      dataSource={data}
      renderItem={(doc) => (
        <List.Item
          actions={[
            <Button key="dl" size="small" onClick={() => onDownload(doc)}>
              Download
            </Button>,
            <Button key="del" size="small" danger onClick={() => onDelete(doc)}>
              Delete
            </Button>,
          ]}
        >
          <List.Item.Meta title={doc.title} description={`${doc.document_type} · ${doc.uploaded_by ?? '—'} · ${doc.created_at}`} />
        </List.Item>
      )}
    />
  );
}

function CareerEventsTab({ employeeId }: { employeeId: number }) {
  const { message } = useFeedback();
  const jobTitlesQuery = useJobTitles({ per_page: 0 });
  const payGradesQuery = usePayGrades({ per_page: 0 });
  const postingHooks = usePostingHooks(employeeId);
  const transfersQuery = useEmployeeTransfers(employeeId);
  const recordTransfer = useRecordTransfer(employeeId);
  const promotionsQuery = useEmployeePromotions(employeeId);
  const recordPromotion = useRecordPromotion(employeeId);

  const [toDept, setToDept] = useState<number>();
  const [transferDate, setTransferDate] = useState('');
  const [toJobTitle, setToJobTitle] = useState<number>();
  const [toPayGrade, setToPayGrade] = useState<number>();
  const [promotionDate, setPromotionDate] = useState('');

  const postingColumns: ColumnsType<EmployeePosting> = [
    { title: 'Department', dataIndex: 'department' },
    { title: 'Start', dataIndex: 'start_date' },
    { title: 'End', dataIndex: 'end_date', render: (v: string | null) => v ?? 'Current' },
    { title: 'Reason', dataIndex: 'reason' },
  ];
  const postingFields: FieldConfig<{ department_id: number; start_date: string; end_date?: string; reason?: string }>[] = [
    { type: 'number', name: 'department_id', label: 'Department ID', required: true, min: 1, helpText: 'No department lookup endpoint — enter the ID directly.' },
    { type: 'text', name: 'start_date', label: 'Start Date (YYYY-MM-DD)', required: true },
    { type: 'text', name: 'end_date', label: 'End Date (YYYY-MM-DD)' },
    { type: 'text', name: 'reason', label: 'Reason' },
  ];

  const onRecordTransfer = () => {
    if (!toDept || !transferDate) {
      message.error('Department and date are required.');
      return;
    }
    recordTransfer.mutate(
      { to_department_id: toDept, effective_date: transferDate },
      { onSuccess: () => message.success('Transfer recorded.'), onError: (error) => message.error(getErrorMessage(error, 'Unable to record transfer.')) },
    );
  };

  const onRecordPromotion = () => {
    if (!toJobTitle || !toPayGrade || !promotionDate) {
      message.error('Job title, pay grade, and date are required.');
      return;
    }
    recordPromotion.mutate(
      { to_job_title_id: toJobTitle, to_pay_grade_id: toPayGrade, effective_date: promotionDate },
      { onSuccess: () => message.success('Promotion recorded.'), onError: (error) => message.error(getErrorMessage(error, 'Unable to record promotion.')) },
    );
  };

  return (
    <div>
      <SectionCard title="Postings (Secondments)">
        <InlineSubResourceCrud<EmployeePosting, { department_id: number; start_date: string; end_date?: string; reason?: string }>
          title="Posting"
          columns={postingColumns}
          fields={postingFields}
          schema={z.object({ department_id: z.number({ required_error: 'Required' }), start_date: z.string().min(1, 'Required'), end_date: z.string().optional(), reason: z.string().optional() })}
          defaultValues={{ department_id: undefined as unknown as number, start_date: '' }}
          toFormValues={() => ({ department_id: undefined as unknown as number, start_date: '' })}
          recordLabel={(r) => r.department ?? `#${r.id}`}
          hooks={postingHooks}
          enableEdit={false}
        />
      </SectionCard>

      <SectionCard title="Department Transfers">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <InputNumber placeholder="To Department ID" value={toDept} onChange={(v) => setToDept(v ?? undefined)} min={1} />
          <input placeholder="YYYY-MM-DD" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} style={{ padding: '4px 11px', border: '1px solid #d7dde3', borderRadius: 6 }} />
          <Button type="primary" onClick={onRecordTransfer} loading={recordTransfer.isPending}>
            Record Transfer
          </Button>
        </div>
        {(transfersQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No transfers recorded" />
        ) : (
          <List dataSource={transfersQuery.data} renderItem={(t) => <List.Item>{t.from_department ?? '—'} → {t.to_department} ({t.effective_date})</List.Item>} />
        )}
      </SectionCard>

      <SectionCard title="Promotions">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <Select style={{ width: 180 }} placeholder="To Job Title" options={(jobTitlesQuery.data?.data ?? []).map((j) => ({ label: j.name, value: j.id }))} value={toJobTitle} onChange={setToJobTitle} />
          <Select style={{ width: 160 }} placeholder="To Pay Grade" options={(payGradesQuery.data?.data ?? []).map((p) => ({ label: p.name, value: p.id }))} value={toPayGrade} onChange={setToPayGrade} />
          <input placeholder="YYYY-MM-DD" value={promotionDate} onChange={(e) => setPromotionDate(e.target.value)} style={{ padding: '4px 11px', border: '1px solid #d7dde3', borderRadius: 6 }} />
          <Button type="primary" onClick={onRecordPromotion} loading={recordPromotion.isPending}>
            Record Promotion
          </Button>
        </div>
        {(promotionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="No promotions recorded" />
        ) : (
          <List dataSource={promotionsQuery.data} renderItem={(p) => <List.Item>{p.from_job_title ?? '—'} → {p.to_job_title} ({p.effective_date})</List.Item>} />
        )}
      </SectionCard>
    </div>
  );
}

function ServiceHistoryTab({ employeeId }: { employeeId: number }) {
  const query = useServiceHistory(employeeId);
  if (query.isLoading) return <LoadingState rows={3} />;
  if ((query.data?.length ?? 0) === 0) return <EmptyState title="No service history yet" />;

  return (
    <Timeline
      items={query.data?.map((e) => ({
        children: (
          <div>
            <strong>{e.type}</strong> — {e.summary}
            <div style={{ color: '#4d5c6b', fontSize: 12 }}>{e.date}</div>
          </div>
        ),
      }))}
    />
  );
}

export function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const id = Number(employeeId);
  const employeeQuery = useEmployee(id);

  const emergencyContactHooks = useEmergencyContactHooks(id);
  const experienceHooks = useExperienceHooks(id);
  const qualificationHooks = useQualificationHooks(id);
  const languageHooks = useLanguageHooks(id);
  const skillHooks = useSkillHooks(id);
  const languagesQuery = useLanguages({ per_page: 0 });
  const skillsQuery = useSkills({ per_page: 0 });
  const educationLevelsQuery = useEducationLevels({ per_page: 0 });

  if (employeeQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  if (employeeQuery.error || !employeeQuery.data) {
    return (
      <PageContainer>
        <ErrorState error={employeeQuery.error} onRetry={() => employeeQuery.refetch()} />
      </PageContainer>
    );
  }

  const employee = employeeQuery.data;

  const emergencyContactColumns: ColumnsType<EmergencyContact> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Relationship', dataIndex: 'relationship' },
    { title: 'Mobile', dataIndex: 'mobile_phone' },
  ];
  const emergencyContactFields: FieldConfig<{ name: string; relationship: string; home_phone?: string; mobile_phone?: string; office_phone?: string }>[] = [
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'text', name: 'relationship', label: 'Relationship', required: true },
    { type: 'text', name: 'mobile_phone', label: 'Mobile Phone' },
    { type: 'text', name: 'home_phone', label: 'Home Phone' },
    { type: 'text', name: 'office_phone', label: 'Office Phone' },
  ];

  const experienceColumns: ColumnsType<Experience> = [
    { title: 'Organization', dataIndex: 'organization_name' },
    { title: 'Job Title', dataIndex: 'job_title' },
    { title: 'Start', dataIndex: 'start_date' },
    { title: 'End', dataIndex: 'end_date', render: (v: string | null) => v ?? 'Current' },
  ];
  const experienceFields: FieldConfig<{ organization_name: string; job_title: string; start_date?: string; end_date?: string; description?: string }>[] = [
    { type: 'text', name: 'organization_name', label: 'Organization', required: true },
    { type: 'text', name: 'job_title', label: 'Job Title', required: true },
    { type: 'text', name: 'start_date', label: 'Start Date (YYYY-MM-DD)' },
    { type: 'text', name: 'end_date', label: 'End Date (YYYY-MM-DD)' },
    { type: 'textarea', name: 'description', label: 'Description' },
  ];

  const qualificationColumns: ColumnsType<Qualification> = [
    { title: 'Education Level', dataIndex: 'education_level' },
    { title: 'Institution', dataIndex: 'institution_name' },
    { title: 'Field', dataIndex: 'field_of_study' },
    { title: 'Highest', dataIndex: 'is_highest', render: (v: boolean) => (v ? 'Yes' : 'No') },
  ];
  const qualificationFields: FieldConfig<{ education_level_id: number; institution_name: string; field_of_study?: string; start_date?: string; completion_date?: string; grade?: string; is_highest?: boolean }>[] = [
    { type: 'select', name: 'education_level_id', label: 'Education Level', required: true, options: (educationLevelsQuery.data?.data ?? []).map((e) => ({ label: e.name, value: e.id })) },
    { type: 'text', name: 'institution_name', label: 'Institution', required: true },
    { type: 'text', name: 'field_of_study', label: 'Field of Study' },
    { type: 'text', name: 'start_date', label: 'Start Date (YYYY-MM-DD)' },
    { type: 'text', name: 'completion_date', label: 'Completion Date (YYYY-MM-DD)' },
    { type: 'text', name: 'grade', label: 'Grade' },
    { type: 'switch', name: 'is_highest', label: 'Highest Qualification' },
  ];

  const languageColumns: ColumnsType<EmployeeLanguage> = [
    { title: 'Language', dataIndex: 'name' },
    { title: 'Proficiency', dataIndex: 'proficiency' },
  ];
  const languageFields: FieldConfig<{ language_id: number; proficiency: string }>[] = [
    { type: 'select', name: 'language_id', label: 'Language', required: true, options: (languagesQuery.data?.data ?? []).map((l) => ({ label: l.name, value: l.id })) },
    {
      type: 'select',
      name: 'proficiency',
      label: 'Proficiency',
      required: true,
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Fluent', value: 'fluent' },
        { label: 'Native', value: 'native' },
      ],
    },
  ];

  const skillColumns: ColumnsType<EmployeeSkill> = [
    { title: 'Skill', dataIndex: 'name' },
    { title: 'Proficiency', dataIndex: 'proficiency' },
  ];
  const skillFields: FieldConfig<{ skill_id: number; proficiency: string }>[] = [
    { type: 'select', name: 'skill_id', label: 'Skill', required: true, options: (skillsQuery.data?.data ?? []).map((s) => ({ label: s.name, value: s.id })) },
    {
      type: 'select',
      name: 'proficiency',
      label: 'Proficiency',
      required: true,
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={employee.full_name}
        breadcrumbs={[{ label: 'HR', path: '/hr/employees' }, { label: 'Employees', path: '/hr/employees' }, { label: employee.employee_code }]}
        description={`${employee.employee_code} · ${employee.job_title?.name ?? 'No job title'} · ${employee.department?.name ?? 'No department'}`}
      />

      <SectionCard title="Summary">
        <DetailCard
          fields={[
            { label: 'Employee Code', value: employee.employee_code },
            { label: 'CNIC', value: employee.cnic },
            { label: 'Department', value: employee.department?.name },
            { label: 'Job Title', value: employee.job_title?.name },
            { label: 'Employment Status', value: employee.employment_status?.name },
            { label: 'Hire Date', value: employee.hire_date },
          ]}
        />
      </SectionCard>

      <Tabs
        items={[
          { key: 'personal', label: 'Personal', children: <PersonalTab employeeId={id} /> },
          { key: 'contact', label: 'Contact', children: <ContactTab employeeId={id} /> },
          { key: 'job', label: 'Job', children: <JobTab employeeId={id} /> },
          { key: 'bank', label: 'Bank', children: <BankTab employeeId={id} /> },
          { key: 'salary', label: 'Salary', children: <SalaryTab employeeId={id} /> },
          { key: 'work-shifts', label: 'Work Shifts', children: <WorkShiftsTab employeeId={id} /> },
          { key: 'documents', label: 'Documents', children: <DocumentsTab employeeId={id} /> },
          {
            key: 'emergency-contacts',
            label: 'Emergency Contacts',
            children: (
              <InlineSubResourceCrud<EmergencyContact, { name: string; relationship: string; home_phone?: string; mobile_phone?: string; office_phone?: string }>
                title="Emergency Contact"
                columns={emergencyContactColumns}
                fields={emergencyContactFields}
                schema={z.object({ name: z.string().min(1, 'Required'), relationship: z.string().min(1, 'Required'), home_phone: z.string().optional(), mobile_phone: z.string().optional(), office_phone: z.string().optional() })}
                defaultValues={{ name: '', relationship: '' }}
                toFormValues={(r) => ({ name: r.name, relationship: r.relationship, home_phone: r.home_phone ?? '', mobile_phone: r.mobile_phone ?? '', office_phone: r.office_phone ?? '' })}
                recordLabel={(r) => r.name}
                hooks={emergencyContactHooks}
              />
            ),
          },
          {
            key: 'experience',
            label: 'Experience',
            children: (
              <InlineSubResourceCrud<Experience, { organization_name: string; job_title: string; start_date?: string; end_date?: string; description?: string }>
                title="Experience"
                columns={experienceColumns}
                fields={experienceFields}
                schema={z.object({ organization_name: z.string().min(1, 'Required'), job_title: z.string().min(1, 'Required'), start_date: z.string().optional(), end_date: z.string().optional(), description: z.string().optional() })}
                defaultValues={{ organization_name: '', job_title: '' }}
                toFormValues={(r) => ({ organization_name: r.organization_name, job_title: r.job_title, start_date: r.start_date ?? '', end_date: r.end_date ?? '', description: r.description ?? '' })}
                recordLabel={(r) => r.organization_name}
                hooks={experienceHooks}
              />
            ),
          },
          {
            key: 'qualifications',
            label: 'Qualifications',
            children: (
              <InlineSubResourceCrud<Qualification, { education_level_id: number; institution_name: string; field_of_study?: string; start_date?: string; completion_date?: string; grade?: string; is_highest?: boolean }>
                title="Qualification"
                columns={qualificationColumns}
                fields={qualificationFields}
                schema={z.object({
                  education_level_id: z.number({ required_error: 'Required' }),
                  institution_name: z.string().min(1, 'Required'),
                  field_of_study: z.string().optional(),
                  start_date: z.string().optional(),
                  completion_date: z.string().optional(),
                  grade: z.string().optional(),
                  is_highest: z.boolean().optional(),
                })}
                defaultValues={{ education_level_id: undefined as unknown as number, institution_name: '' }}
                toFormValues={() => ({ education_level_id: undefined as unknown as number, institution_name: '' })}
                recordLabel={(r) => r.institution_name}
                hooks={qualificationHooks}
              />
            ),
          },
          {
            key: 'languages',
            label: 'Languages',
            children: (
              <InlineSubResourceCrud<EmployeeLanguage, { language_id: number; proficiency: string }>
                title="Language"
                columns={languageColumns}
                fields={languageFields}
                schema={z.object({ language_id: z.number({ required_error: 'Required' }), proficiency: z.string().min(1, 'Required') })}
                defaultValues={{ language_id: undefined as unknown as number, proficiency: 'basic' }}
                toFormValues={(r) => ({ language_id: r.id, proficiency: r.proficiency })}
                recordLabel={(r) => r.name}
                hooks={languageHooks}
              />
            ),
          },
          {
            key: 'skills',
            label: 'Skills',
            children: (
              <InlineSubResourceCrud<EmployeeSkill, { skill_id: number; proficiency: string }>
                title="Skill"
                columns={skillColumns}
                fields={skillFields}
                schema={z.object({ skill_id: z.number({ required_error: 'Required' }), proficiency: z.string().min(1, 'Required') })}
                defaultValues={{ skill_id: undefined as unknown as number, proficiency: 'basic' }}
                toFormValues={(r) => ({ skill_id: r.id, proficiency: r.proficiency })}
                recordLabel={(r) => r.name}
                hooks={skillHooks}
              />
            ),
          },
          { key: 'career-events', label: 'Career Events', children: <CareerEventsTab employeeId={id} /> },
          { key: 'service-history', label: 'Service History', children: <ServiceHistoryTab employeeId={id} /> },
        ]}
      />
    </PageContainer>
  );
}
