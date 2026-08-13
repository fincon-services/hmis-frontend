import type { CSSProperties, ReactNode } from 'react';
import { TABLET_SPAN, type FieldSpan } from './gridSpan';

export type { FieldSpan };

interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  helpText?: ReactNode;
  error?: string;
  /** Desktop column span out of 12. Defaults to a full row. */
  span?: FieldSpan;
  /** Render the control inline with the label row (e.g. switches) instead of below it. */
  inline?: boolean;
  children: ReactNode;
}

/**
 * Single form-field wrapper: label + required marker + control + help/error
 * text, sized within a `FormGrid` via `span`. Used by `GeneratedForm`
 * internally, and directly by hand-rolled forms that need grid-aligned
 * fields outside the generated-field pipeline (e.g. dynamic line items).
 */
export function FormField({ label, htmlFor, required, helpText, error, span = 12, inline, children }: FormFieldProps) {
  const style = { '--col-desktop': span, '--col-tablet': TABLET_SPAN[span] } as CSSProperties;

  return (
    <div className="form-field" style={style}>
      {label &&
        (inline ? (
          <label htmlFor={htmlFor} className="form-field-label form-field-label-inline">
            <span>
              {label} {required && <span className="form-field-required">*</span>}
            </span>
            {children}
          </label>
        ) : (
          <label htmlFor={htmlFor} className="form-field-label">
            {label} {required && <span className="form-field-required">*</span>}
          </label>
        ))}

      {!inline && children}

      {helpText && !error && <div className="form-field-help">{helpText}</div>}
      {error && <div className="form-field-error">{error}</div>}
    </div>
  );
}
