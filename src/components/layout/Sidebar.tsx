import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Hospital } from 'lucide-react';
import { navSections, navItems, isNavGroup, type NavItem } from '@/constants/nav';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function toMenuItem(item: NavItem, deniedScreens: Set<string>): MenuItem | null {
  if (isNavGroup(item)) {
    const children = item.children
      .map((child) => toMenuItem(child, deniedScreens))
      .filter((child): child is MenuItem => child !== null);

    if (children.length === 0) return null;

    const Icon = item.icon;
    return {
      key: item.key,
      icon: <Icon size={16} />,
      label: item.label,
      children,
    };
  }

  if (item.screen && deniedScreens.has(item.screen)) return null;

  const Icon = item.icon;
  return {
    key: item.key,
    icon: Icon ? <Icon size={16} /> : undefined,
    label: item.label,
  };
}

function findPathByKey(items: NavItem[], key: string): string | undefined {
  for (const item of items) {
    if (isNavGroup(item)) {
      const found = findPathByKey(item.children, key);
      if (found) return found;
    } else if (item.key === key) {
      return item.path;
    }
  }
  return undefined;
}

function findActiveKeys(items: NavItem[], pathname: string): { selected: string[]; open: string[] } {
  for (const item of items) {
    if (isNavGroup(item)) {
      for (const child of item.children) {
        if (pathname.startsWith(child.path)) {
          return { selected: [child.key], open: [item.key] };
        }
      }
    } else if (pathname.startsWith(item.path)) {
      return { selected: [item.key], open: [] };
    }
  }
  return { selected: [], open: [] };
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const deniedScreens = useAuthStore((s) => s.deniedScreens);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = useMemo(
    () =>
      navSections
        .map((section): MenuItem | null => {
          const children = section.items
            .map((item) => toMenuItem(item, deniedScreens))
            .filter((child): child is MenuItem => child !== null);

          if (children.length === 0) return null;

          return { key: section.key, type: 'group', label: section.label, children };
        })
        .filter((section): section is MenuItem => section !== null),
    [deniedScreens],
  );

  const { selected, open } = useMemo(() => findActiveKeys(navItems, location.pathname), [location.pathname]);

  return (
    <Sider theme="dark" collapsible collapsed={collapsed} trigger={null} width={248} style={{ overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 56,
          padding: collapsed ? '0 16px' : '0 20px',
          color: '#fff',
          fontWeight: 600,
          fontSize: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Hospital size={22} />
        {!collapsed && <span>HMIS</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selected}
        defaultOpenKeys={open}
        items={menuItems}
        onClick={({ key }) => {
          const path = findPathByKey(navItems, key);
          if (path) navigate(path);
        }}
      />
    </Sider>
  );
}
