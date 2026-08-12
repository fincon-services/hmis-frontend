import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';

interface SectionCardProps {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, extra, children }: SectionCardProps) {
  return (
    <Card
      variant="borderless"
      style={{ border: '1px solid #d7dde3', marginBottom: 16 }}
      styles={{ body: { padding: 20 } }}
      title={<Typography.Text strong>{title}</Typography.Text>}
      extra={extra}
    >
      {children}
    </Card>
  );
}
