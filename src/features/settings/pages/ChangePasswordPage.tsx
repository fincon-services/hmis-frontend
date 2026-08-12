import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { useFeedback } from '@/hooks/useFeedback';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const schema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

const fields: FieldConfig<FormValues>[] = [
  { type: 'password', name: 'old_password', label: 'Current Password', required: true, autoComplete: 'current-password' },
  { type: 'password', name: 'password', label: 'New Password', required: true, autoComplete: 'new-password' },
  { type: 'password', name: 'password_confirmation', label: 'Confirm New Password', required: true, autoComplete: 'new-password' },
];

export function ChangePasswordPage() {
  const { message } = useFeedback();
  const changePassword = useChangePassword();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        message.success('Password updated successfully.');
        reset();
      },
      onError: (error) => {
        const handled = applyServerValidationErrors(error, setError);
        if (!handled) message.error(getErrorMessage(error, 'Unable to update password.'));
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader title="Change Password" breadcrumbs={[{ label: 'Settings' }, { label: 'Change Password' }]} />
      <SectionCard title="Update your password">
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 420 }}>
          <GeneratedForm fields={fields} control={control} errors={errors} />
          <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
            Update password
          </Button>
        </form>
      </SectionCard>
    </PageContainer>
  );
}
