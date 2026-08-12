import type { ReactNode } from 'react';
import { Space } from 'antd';

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Space wrap style={{ marginBottom: 16 }}>
      {children}
    </Space>
  );
}
