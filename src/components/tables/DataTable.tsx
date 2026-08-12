import type { ReactNode } from 'react';
import { Table, Space } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { PaginationMeta } from '@/types/api';

interface DataTableProps<T> {
  columns: ColumnsType<T>;
  data: T[] | undefined;
  rowKey: string | ((record: T) => string | number);
  loading: boolean;
  error?: unknown;
  onRetry?: () => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number, pageSize: number) => void;
  onSortChange?: (sort: { field?: string; order?: 'asc' | 'desc' }) => void;
  rowSelection?: TableProps<T>['rowSelection'];
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  bulkActions?: ReactNode;
  selectedCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (record: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  loading,
  error,
  onRetry,
  meta,
  onPageChange,
  onSortChange,
  rowSelection,
  toolbarLeft,
  toolbarRight,
  bulkActions,
  selectedCount = 0,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
}: DataTableProps<T>) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  const showEmpty = !loading && (data?.length ?? 0) === 0;

  return (
    <div>
      {(toolbarLeft || toolbarRight) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <div>{toolbarLeft}</div>
          <div>{toolbarRight}</div>
        </div>
      )}

      {selectedCount > 0 && bulkActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#e9f2f5',
            border: '1px solid #bcdbe3',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13 }}>{selectedCount} selected</span>
          <Space>{bulkActions}</Space>
        </div>
      )}

      {showEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
      ) : (
        <Table<T>
          columns={columns}
          dataSource={data}
          rowKey={rowKey}
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 'max-content' }}
          size="middle"
          onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } }) : undefined}
          onChange={(pagination, _filters, sorter) => {
            if (onPageChange && pagination.current && pagination.pageSize) {
              onPageChange(pagination.current, pagination.pageSize);
            }
            if (onSortChange) {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              onSortChange({
                field: s?.field ? String(s.field) : undefined,
                order: s?.order === 'ascend' ? 'asc' : s?.order === 'descend' ? 'desc' : undefined,
              });
            }
          }}
          pagination={
            meta
              ? {
                  current: meta.current_page,
                  pageSize: meta.per_page,
                  total: meta.total,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                }
              : false
          }
        />
      )}
    </div>
  );
}
