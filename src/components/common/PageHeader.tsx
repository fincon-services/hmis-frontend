import type { ReactNode } from 'react';
import { Breadcrumb, Typography } from 'antd';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: ReactNode;
  description?: string;
}

export function PageHeader({ title, breadcrumbs, extra, description }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumbs.map((b) => ({
            title: b.path ? <Link to={b.path}>{b.label}</Link> : b.label,
          }))}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {description && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {description}
            </Typography.Text>
          )}
        </div>
        {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
      </div>
    </div>
  );
}
