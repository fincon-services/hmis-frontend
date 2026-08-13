import type { ReactNode } from 'react';
import { Drawer } from 'antd';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_WIDTH: Record<DrawerSize, number | string> = {
  sm: 420,
  md: 560,
  lg: 760,
  xl: '92vw',
};

interface FormDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Preset width — sm=420, md=560, lg=760, xl=92vw. Defaults to md. */
  size?: DrawerSize;
  /** Usually a `StickyFormActions` instance — Drawer keeps it fixed below the scrolling body natively. */
  footer?: ReactNode;
}

/** For forms too large even for an `xl` FormModal, or that benefit from a persistent side panel (e.g. reviewing a record while editing it). */
export function FormDrawer({ title, open, onClose, children, size = 'md', footer }: FormDrawerProps) {
  return (
    <Drawer title={title} open={open} onClose={onClose} width={SIZE_WIDTH[size]} destroyOnHidden footer={footer} styles={{ body: { paddingTop: 16 } }}>
      {children}
    </Drawer>
  );
}
