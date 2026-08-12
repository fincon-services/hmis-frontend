import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Typography, Alert } from 'antd';
import { Hospital } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLogin } from '../hooks/useLogin';
import { applyServerValidationErrors, getErrorMessage } from '@/utils/errors';
import { GeneratedForm } from '@/components/forms/GeneratedForm';
import type { FieldConfig } from '@/components/forms/FieldConfig';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const fields: FieldConfig<LoginFormValues>[] = [
  { type: 'text', name: 'username', label: 'Username', required: true, placeholder: 'admin' },
  { type: 'password', name: 'password', label: 'Password', required: true, autoComplete: 'current-password' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired] = useState(() => {
    const expired = sessionStorage.getItem('hmis-session-expired') === '1';
    if (expired) sessionStorage.removeItem('hmis-session-expired');
    return expired;
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
        navigate(from, { replace: true });
      },
      onError: (error) => {
        const handled = applyServerValidationErrors(error, setError);
        if (!handled) setFormError(getErrorMessage(error, 'Invalid username or password'));
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f5f7',
      }}
    >
      <div
        style={{
          width: 400,
          background: '#fff',
          border: '1px solid #d7dde3',
          borderRadius: 8,
          padding: '36px 32px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ background: '#0f5b78', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <Hospital size={28} color="#fff" />
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Hospital Management Information System
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Sign in to continue
          </Typography.Text>
        </div>

        {sessionExpired && !formError && (
          <Alert type="warning" message="Session Expired" description="Your session has expired. Please sign in again." showIcon style={{ marginBottom: 16 }} />
        )}
        {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <GeneratedForm fields={fields} control={control} errors={errors} />

          <Button type="primary" htmlType="submit" size="large" block loading={login.isPending} style={{ marginTop: 8 }}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
