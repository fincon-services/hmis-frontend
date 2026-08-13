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
      style={{ border: '1px solid #d7dde3', marginBottom: 14 }}
      styles={{ header: { minHeight: 42 }, body: { padding: 16 } }}
      title={<Typography.Text strong style={{ fontSize: 13.5 }}>{title}</Typography.Text>}
      extra={extra}
    >
      {children}
    </Card>
  );
}
