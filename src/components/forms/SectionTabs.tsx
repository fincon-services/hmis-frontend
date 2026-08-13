import type { ReactNode } from 'react';
import { Tabs } from 'antd';

export interface SectionTabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

interface SectionTabsProps {
  items: SectionTabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  /** `rail` puts section navigation in a left column with the active section's content on the right — for very large multi-section forms (e.g. employee bio-data). Defaults to a compact horizontal tab bar. */
  variant?: 'horizontal' | 'rail';
}

/**
 * Thin, compact-styled wrapper around antd `Tabs` for the "single form,
 * tabbed/steppable sections" pattern. Distinct from ad hoc `<Tabs>` usage
 * elsewhere that navigates between independent record sections (e.g. patient
 * visit history) — this is specifically for splitting one large form.
 */
export function SectionTabs({ items, activeKey, onChange, variant = 'horizontal' }: SectionTabsProps) {
  return (
    <Tabs
      items={items.map((item) => ({
        key: item.key,
        label: item.icon ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {item.icon}
            {item.label}
          </span>
        ) : (
          item.label
        ),
        children: item.children,
      }))}
      activeKey={activeKey}
      onChange={onChange}
      tabPosition={variant === 'rail' ? 'left' : 'top'}
      size="small"
    />
  );
}
