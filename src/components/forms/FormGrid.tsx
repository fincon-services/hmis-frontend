import type { ReactNode } from 'react';

/**
 * 12-column responsive grid for form fields. Children are expected to be
 * `FormField`s (or anything else declaring `grid-column` via the
 * `.form-field`/`.form-section-header` CSS classes in index.css) — the grid
 * itself only owns the column tracks and gutter, sizing is per-field.
 */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}
