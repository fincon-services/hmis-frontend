import { Layout, Dropdown, Avatar, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Menu as MenuIcon, User, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useSwitchRole } from '@/features/auth/hooks/useSwitchRole';
import { useFeedback } from '@/hooks/useFeedback';
import { getErrorMessage } from '@/utils/errors';
import { StatusBadge } from '@/components/common/StatusBadge';

const { Header: AntHeader } = Layout;

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const activeRoleId = useAuthStore((s) => s.activeRoleId);
  const navigate = useNavigate();
  const { message } = useFeedback();

  const logout = useLogout();
  const switchRole = useSwitchRole();

  const activeRole = roles.find((r) => r.id === activeRoleId);

  const handleSwitchRole = (roleId: number) => {
    switchRole.mutate(
      { role_id: roleId },
      {
        onSuccess: () => message.success('Active role switched.'),
        onError: (err) => message.error(getErrorMessage(err, 'Unable to switch role.')),
      },
    );
  };

  const menuItems: MenuProps['items'] = [
    ...(roles.length > 1
      ? [
          {
            key: 'roles',
            type: 'group' as const,
            label: 'Switch role',
            children: roles.map((role) => ({
              key: `role-${role.id}`,
              label: role.name,
              disabled: role.id === activeRoleId,
              onClick: () => handleSwitchRole(role.id),
            })),
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'change-password',
      icon: <KeyRound size={14} />,
      label: 'Change password',
      onClick: () => navigate('/settings/change-password'),
    },
    {
      key: 'logout',
      icon: <LogOut size={14} />,
      label: 'Log out',
      onClick: () => logout.mutate(undefined, { onSuccess: () => navigate('/login') }),
    },
  ];

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #d7dde3',
        height: 56,
        lineHeight: '56px',
      }}
    >
      <Button type="text" icon={<MenuIcon size={18} />} onClick={toggleSidebar} aria-label="Toggle sidebar" />

      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56 }}>
          <Avatar size={28} icon={<User size={16} />} />
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 500 }}>{user?.username}</span>
            {activeRole && <StatusBadge label={activeRole.name} tone="info" />}
          </span>
          <ChevronDown size={14} />
        </Button>
      </Dropdown>
    </AntHeader>
  );
}
