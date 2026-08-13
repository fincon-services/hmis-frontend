import type { ReactNode } from 'react';
import { Modal, Button } from 'antd';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_WIDTH: Record<ModalSize, number | string> = {
  sm: 480,
  md: 640,
  lg: 900,
  xl: '90vw',
};

interface FormModalProps {
  title: string;
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  confirmLoading?: boolean;
  children: ReactNode;
  /** Preset width — sm=480, md=640, lg=900, xl=90vw. Defaults to md. Ignored when `width` is set. */
  size?: ModalSize;
  /** Explicit pixel width, for call sites that need a specific value instead of a preset. */
  width?: number;
  okText?: string;
  /** Extra footer action(s) rendered between Cancel and Save — e.g. a "Save & Next" button. */
  extraActions?: ReactNode;
}

/**
 * Header fixed, body scrolls internally past a max-height, footer fixed —
 * so Cancel/Save stay reachable without scrolling a tall form to the bottom.
 * Size presets replace ad hoc per-call-site `width` numbers; `width` still
 * works for one-off cases.
 */
export function FormModal({ title, open, onCancel, onSubmit, confirmLoading, children, size = 'md', width, okText = 'Save', extraActions }: FormModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={width ?? SIZE_WIDTH[size]}
      destroyOnHidden
      maskClosable={false}
      styles={{ body: { maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingTop: 2 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel}>Cancel</Button>
          {extraActions}
          <Button type="primary" onClick={onSubmit} loading={confirmLoading}>
            {okText}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}
