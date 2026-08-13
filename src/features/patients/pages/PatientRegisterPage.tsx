import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRound, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { StickyFormActions } from '@/components/forms/StickyFormActions';
import { useRegisterPatient } from '../hooks/useRegisterPatient';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useFeedback } from '@/hooks/useFeedback';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const nameRegex = /^[a-zA-Z ]+$/;
const phoneRegex = /^03\d{9}$/;
const cnicRegex = /^[1-9]\d{4}-\d{7}-\d{1}$/;

const schema = z
  .object({
    name: z.string().regex(nameRegex, 'Letters and spaces only').min(3, 'At least 3 characters').max(30),
    gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
    age: z.number({ required_error: 'Age is required', invalid_type_error: 'Age is required' }).gt(0, 'Age cannot be 0'),
    age_type: z.enum(['years', 'months', 'days'], { required_error: 'Age type is required' }),
    guardian_name: z.string().regex(nameRegex, 'Letters and spaces only').min(3, 'At least 3 characters').max(30),
    guardian_phone: z.string().regex(phoneRegex, 'Must be 11 digits starting with 03').optional().or(z.literal('')),
    guardian_cnic: z.string().regex(cnicRegex, 'Format: XXXXX-XXXXXXX-X').optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    referred_from: z.string().max(200).optional().or(z.literal('')),
    origin: z.enum(['OPD', 'ER'], { required_error: 'Origin is required' }),
  })
  .refine((data) => !!data.guardian_phone || !!data.guardian_cnic, {
    message: 'Provide a guardian phone number or CNIC',
    path: ['guardian_phone'],
  });

type FormValues = z.infer<typeof schema>;

const fields: FieldConfig<FormValues>[] = [
  { type: 'section', label: 'Patient Information', icon: UserRound },
  { type: 'text', name: 'name', label: 'Patient Name', required: true, placeholder: 'Ali Khan', span: 6 },
  {
    type: 'select',
    name: 'gender',
    label: 'Gender',
    required: true,
    span: 3,
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
    ],
  },
  {
    type: 'select',
    name: 'origin',
    label: 'Origin',
    required: true,
    span: 3,
    options: [
      { label: 'OPD', value: 'OPD' },
      { label: 'ER', value: 'ER' },
    ],
  },
  { type: 'number', name: 'age', label: 'Age', required: true, min: 0, step: 1, span: 3 },
  {
    type: 'select',
    name: 'age_type',
    label: 'Age Unit',
    required: true,
    span: 3,
    options: [
      { label: 'Years', value: 'years' },
      { label: 'Months', value: 'months' },
      { label: 'Days', value: 'days' },
    ],
  },

  { type: 'section', label: 'Guardian Information', description: 'A phone number or CNIC is required to reach the guardian.', icon: Users },
  { type: 'text', name: 'guardian_name', label: 'Guardian Name', required: true, placeholder: 'Ahmed Khan', span: 4 },
  { type: 'text', name: 'guardian_phone', label: 'Guardian Phone', placeholder: '03001234567', helpText: 'Required unless CNIC is provided', span: 4 },
  { type: 'text', name: 'guardian_cnic', label: 'Guardian CNIC', placeholder: '12345-1234567-1', span: 4 },

  { type: 'section', label: 'Additional Information', icon: FileText },
  { type: 'text', name: 'referred_from', label: 'Referred From', span: 4 },
  { type: 'textarea', name: 'address', label: 'Address', span: 12 },
];

export function PatientRegisterPage() {
  const navigate = useNavigate();
  const { message } = useFeedback();
  const register = useRegisterPatient();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    register.mutate(
      {
        ...values,
        guardian_phone: values.guardian_phone || undefined,
        guardian_cnic: values.guardian_cnic || undefined,
        address: values.address || undefined,
        referred_from: values.referred_from || undefined,
      },
      {
        onSuccess: (patient) => {
          message.success(`Patient registered — MR# ${patient.mr_no}`);
          navigate(`/patients/${patient.id}`);
        },
        onError: (error) => {
          const handled = applyServerValidationErrors(error, setError);
          if (!handled) message.error(getErrorMessage(error, 'Unable to register patient.'));
        },
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Register Patient"
        breadcrumbs={[{ label: 'Patients', path: '/patients' }, { label: 'Register' }]}
      />
      <SectionCard title="Patient & Guardian Details">
        <div style={{ maxWidth: 1040 }}>
          <GeneratedForm fields={fields} control={control} errors={errors} />
          <StickyFormActions onCancel={() => navigate('/patients')} onSave={handleSubmit(onSubmit)} saveText="Register Patient" saveLoading={register.isPending} />
        </div>
      </SectionCard>
    </PageContainer>
  );
}
