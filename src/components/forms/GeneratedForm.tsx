import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input, InputNumber, Switch, Select, DatePicker, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { FormGrid } from './FormGrid';
import { FormField } from './FormField';
import { FormSection } from './FormSection';
import { defaultSpanFor, type FieldConfig } from './FieldConfig';

interface GeneratedFormProps<T extends FieldValues> {
  fields: FieldConfig<T>[];
  control: Control<T>;
  errors: FieldErrors<T>;
}

/**
 * Renders a flat `FieldConfig[]` (with optional `section` markers) into a
 * responsive 12-column grid (`FormGrid`), one `FormField` per entry sized by
 * its resolved span. This is the app's single form renderer — `CrudResourcePage`,
 * `InlineSubResourceCrud`, and every hand-built page that imports it all get
 * the grid layout for free.
 */
export function GeneratedForm<T extends FieldValues>({ fields, control, errors }: GeneratedFormProps<T>) {
  return (
    <FormGrid>
      {fields.map((field, index) => {
        if (field.type === 'section') {
          return <FormSection key={`section-${field.label}`} label={field.label} description={field.description} icon={field.icon} first={index === 0} />;
        }

        const error = errors[field.name];
        const errorMessage = typeof error?.message === 'string' ? error.message : undefined;
        const span = field.span ?? defaultSpanFor(field);

        if (field.type === 'switch') {
          return (
            <FormField key={field.name} label={field.label} required={field.required} helpText={field.helpText} error={errorMessage} span={span} inline>
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => <Switch checked={!!rhf.value} onChange={rhf.onChange} disabled={field.disabled} />}
              />
            </FormField>
          );
        }

        return (
          <FormField key={field.name} label={field.label} htmlFor={field.name} required={field.required} helpText={field.helpText} error={errorMessage} span={span}>
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

            {field.type === 'date' && (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhf }) => (
                  <DatePicker
                    id={field.name}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    status={error ? 'error' : undefined}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    value={rhf.value ? dayjs(rhf.value) : null}
                    onChange={(val) => rhf.onChange(val ? val.format('YYYY-MM-DD') : '')}
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
          </FormField>
        );
      })}
    </FormGrid>
  );
}
