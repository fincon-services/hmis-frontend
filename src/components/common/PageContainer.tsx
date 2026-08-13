import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div style={{ padding: '16px 20px', maxWidth: 1600, margin: '0 auto' }}>{children}</div>;
}
