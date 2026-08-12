import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const menuItems: MenuProps['items'] = items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    danger: item.danger,
    onClick: item.onClick,
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button type="text" size="small" icon={<MoreVertical size={16} />} onClick={(e) => e.stopPropagation()} aria-label="Row actions" />
    </Dropdown>
  );
}
