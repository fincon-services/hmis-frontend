import { Card, Typography, Skeleton } from 'antd';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value?: number | string;
  icon?: LucideIcon;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, loading, onClick }: StatCardProps) {
  return (
    <Card
      variant="borderless"
      style={{ border: '1px solid #d7dde3', cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: 18 } }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            {label}
          </Typography.Text>
          {loading ? (
            <Skeleton.Input active size="small" style={{ marginTop: 6, width: 60 }} />
          ) : (
            <div style={{ fontSize: 26, fontWeight: 600, color: '#1a2530', marginTop: 2 }}>{value ?? '—'}</div>
          )}
        </div>
        {Icon && (
          <div style={{ background: '#e9f2f5', color: '#0f5b78', borderRadius: 8, padding: 10, display: 'flex' }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
