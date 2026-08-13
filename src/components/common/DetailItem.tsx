import type { CSSProperties, ReactNode } from 'react';
import { TABLET_SPAN, type FieldSpan } from '../forms/gridSpan';

interface DetailItemProps {
  label: string;
  value: ReactNode;
  /** Desktop column span out of 12. Defaults to 3 (4-across), matching typical short label/value pairs. */
  span?: FieldSpan;
}

/**
 * Compact label-above-value pair for a `DetailGrid` — no bordered-table
 * chrome, just a muted uppercase label and the value, matching the reference
 * "Employee Name · ALI" density. For a bordered key-value table look, use
 * `DetailCard` instead.
 */
export function DetailItem({ label, value, span = 3 }: DetailItemProps) {
  const style = { '--col-desktop': span, '--col-tablet': TABLET_SPAN[span] } as CSSProperties;

  return (
    <div className="detail-item" style={style}>
      <div className="detail-item-label">{label}</div>
      <div className="detail-item-value">{value ?? '—'}</div>
    </div>
  );
}
