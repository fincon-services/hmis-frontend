import type { ReactNode } from 'react';

/** Responsive label/value grid — see `DetailItem`. Desktop up to 4-across, tablet 2, mobile 1. */
export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="detail-grid">{children}</div>;
}
