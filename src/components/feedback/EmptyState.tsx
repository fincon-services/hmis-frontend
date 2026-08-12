import type { ReactNode } from 'react';
import { Empty, Button } from 'antd';
import { PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
}

export function EmptyState({ title = 'No records found', description, actionLabel, onAction, extra }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Empty
        description={
          <div>
            <div style={{ fontWeight: 500, color: '#1a2530' }}>{title}</div>
            {description && <div style={{ color: '#4d5c6b', fontSize: 13, marginTop: 4 }}>{description}</div>}
          </div>
        }
      />
      {actionLabel && onAction && (
        <Button type="primary" icon={<PlusCircle size={16} />} onClick={onAction} style={{ marginTop: 16 }}>
          {actionLabel}
        </Button>
      )}
      {extra}
    </div>
  );
}
