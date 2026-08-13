import type { FieldValues, Path } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import type { FieldSpan } from './FormField';

interface BaseField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
  /**
   * Desktop column span out of 12 (tablet/mobile collapse automatically —
   * see FormField). Omit to use a sensible per-`type` default: short/enum
   * fields (switch, date, number, short select) default to 3, names/text
   * default to 4, textarea/address/remarks default to a full row (12).
   */
  span?: FieldSpan;
}

/** A non-field marker that splits a long flat field list into named sections (e.g. "Personal Information", "Contact Information") without breaking it into separate cards — see GeneratedForm. */
export interface SectionMarker {
  type: 'section';
  label: string;
  /** Optional one-line note under the section label. */
  description?: string;
  icon?: LucideIcon;
}

export type FieldConfig<T extends FieldValues> =
  | (BaseField<T> & { type: 'text'; placeholder?: string })
  | (BaseField<T> & { type: 'password'; placeholder?: string; autoComplete?: string })
  | (BaseField<T> & { type: 'textarea'; placeholder?: string })
  | (BaseField<T> & { type: 'number'; min?: number; max?: number; step?: number })
  | (BaseField<T> & { type: 'switch' })
  | (BaseField<T> & { type: 'select'; options: { label: string; value: string | number }[] })
  | (BaseField<T> & { type: 'date'; placeholder?: string })
  | (BaseField<T> & { type: 'time' })
  | SectionMarker;

/** Sensible default desktop span per field type when a field doesn't declare its own `span`. */
export function defaultSpanFor<T extends FieldValues>(field: FieldConfig<T>): FieldSpan {
  switch (field.type) {
    case 'switch':
    case 'date':
    case 'time':
    case 'number':
      return 3;
    case 'select':
      return 4;
    case 'text':
    case 'password':
      return 4;
    case 'textarea':
      return 12;
    default:
      return 12;
  }
}
