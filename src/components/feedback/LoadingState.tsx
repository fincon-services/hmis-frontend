import { Skeleton, Spin } from 'antd';

export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: '12px 0' }}>
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}

export function InlineSpinner() {
  return <Spin size="small" />;
}
