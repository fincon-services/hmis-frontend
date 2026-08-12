import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, InputNumber, Switch, Select, TimePicker, Typography, Divider } from 'antd';
import dayjs from 'dayjs';
import type { FieldConfig } from './FieldConfig';

interface GeneratedFormProps<T extends FieldValues> {
  fields: FieldConfig<T>[];
  control: Control<T>;
  errors: FieldErrors<T>;
}

export function GeneratedForm<T extends FieldValues>({ fields, control, errors }: GeneratedFormProps<T>) {
  return (
    <>
      {fields.map((field, index) => {
        if (field.type === 'section') {
          return (
            <div key={`section-${field.label}`} style={{ marginTop: index === 0 ? 0 : 8, marginBottom: 16 }}>
              {index > 0 && <Divider style={{ margin: '0 0 16px' }} />}
              <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
                {field.label}
              </Typography.Text>
              {field.description && (
                <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                  {field.description}
                </Typography.Text>
              )}
            </div>
          );
        }

        const error = errors[field.name];
        const errorMessage = typeof error?.message === 'string' ? error.message : undefined;
        const isSwitch = field.type === 'switch';

        return (
          <div key={field.name} style={{ marginBottom: 16 }}>
            <label
              htmlFor={field.name}
              style={{
                display: isSwitch ? 'flex' : 'block',
                alignItems: 'center',
                justifyContent: isSwitch ? 'space-between' : undefined,
                marginBottom: isSwitch ? 0 : 6,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <span>
                {field.label} {field.required && <span style={{ color: '#b3261e' }}>*</span>}
              </span>

              {isSwitch && (
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: rhf }) => <Switch checked={!!rhf.value} onChange={rhf.onChange} disabled={field.disabled} />}
                />
              )}
            </label>

            {field.type === 'text' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <Input id={field.name} status={error ? 'error' : undefined} placeholder={field.placeholder} disabled={field.disabled} {...rhf} value={rhf.value ?? ''} />
                )}
              />
            )}

            {field.type === 'password' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <Input.Password
                    id={field.name}
                    status={error ? 'error' : undefined}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    autoComplete={field.autoComplete}
                    {...rhf}
                    value={rhf.value ?? ''}
                  />
                )}
              />
            )}

            {field.type === 'textarea' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <Input.TextArea id={field.name} status={error ? 'error' : undefined} placeholder={field.placeholder} disabled={field.disabled} rows={3} {...rhf} value={rhf.value ?? ''} />
                )}
              />
            )}

            {field.type === 'number' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <InputNumber
                    id={field.name}
                    style={{ width: '100%' }}
                    status={error ? 'error' : undefined}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    disabled={field.disabled}
                    value={rhf.value}
                    onChange={(val) => rhf.onChange(val)}
                  />
                )}
              />
            )}

            {field.type === 'select' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <Select
                    id={field.name}
                    style={{ width: '100%' }}
                    status={error ? 'error' : undefined}
                    options={field.options}
                    disabled={field.disabled}
                    value={rhf.value}
                    onChange={rhf.onChange}
                    allowClear
                  />
                )}
              />
            )}

            {field.type === 'time' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <TimePicker
                    id={field.name}
                    style={{ width: '100%' }}
                    format="HH:mm"
                    status={error ? 'error' : undefined}
                    disabled={field.disabled}
                    value={rhf.value ? dayjs(rhf.value, 'HH:mm') : null}
                    onChange={(val) => rhf.onChange(val ? val.format('HH:mm') : '')}
                  />
                )}
              />
            )}

            {field.helpText && !errorMessage && (
              <div style={{ color: '#4d5c6b', fontSize: 12, marginTop: 4 }}>{field.helpText}</div>
            )}
            {errorMessage && <div style={{ color: '#b3261e', fontSize: 12, marginTop: 4 }}>{errorMessage}</div>}
          </div>
        );
      })}
    </>
  );
}
