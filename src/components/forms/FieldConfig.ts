import type { FieldValues, Path } from 'react-hook-form';

interface BaseField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
}

/** A non-field marker that splits a long flat field list into named sections (e.g. "Personal Information", "Contact Information") without breaking it into separate cards — see GeneratedForm. */
export interface SectionMarker {
  type: 'section';
  label: string;
  /** Optional one-line note under the section label. */
  description?: string;
}

export type FieldConfig<T extends FieldValues> =
  | (BaseField<T> & { type: 'text'; placeholder?: string })
  | (BaseField<T> & { type: 'password'; placeholder?: string; autoComplete?: string })
  | (BaseField<T> & { type: 'textarea'; placeholder?: string })
  | (BaseField<T> & { type: 'number'; min?: number; max?: number; step?: number })
  | (BaseField<T> & { type: 'switch' })
  | (BaseField<T> & { type: 'select'; options: { label: string; value: string | number }[] })
  | (BaseField<T> & { type: 'time' })
  | SectionMarker;
