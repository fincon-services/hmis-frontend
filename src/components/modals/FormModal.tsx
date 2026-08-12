import type { ReactNode } from 'react';
import { Modal } from 'antd';

interface FormModalProps {
  title: string;
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  confirmLoading?: boolean;
  children: ReactNode;
  width?: number;
  okText?: string;
}

export function FormModal({ title, open, onCancel, onSubmit, confirmLoading, children, width = 560, okText = 'Save' }: FormModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={confirmLoading}
      width={width}
      okText={okText}
      destroyOnHidden
      maskClosable={false}
    >
      {children}
    </Modal>
  );
}
