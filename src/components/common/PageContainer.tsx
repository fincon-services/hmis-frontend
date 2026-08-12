import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>{children}</div>;
}
