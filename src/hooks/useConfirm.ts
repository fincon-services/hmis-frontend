import { useFeedback } from './useFeedback';

interface ConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

/** Modal-based confirmation for dangerous actions — never window.confirm(). */
export function useConfirm() {
  const { modal } = useFeedback();

  return ({ title, content, okText = 'Confirm', danger = false, onConfirm }: ConfirmOptions) => {
    modal.confirm({
      title,
      content,
      okText,
      okButtonProps: { danger },
      cancelText: 'Cancel',
      onOk: onConfirm,
    });
  };
}
