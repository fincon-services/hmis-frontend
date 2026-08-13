import type { ReactNode } from 'react';
import { Button } from 'antd';

interface StickyFormActionsProps {
  onCancel?: () => void;
  cancelText?: string;
  onSave: () => void;
  saveText?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  /** Extra action(s) rendered between Cancel and Save — e.g. a "Save & Next" button. */
  extra?: ReactNode;
}

/**
 * Pinned action bar for long, scrollable forms so Save/Cancel stay reachable
 * without scrolling to the bottom of the page. Inside `FormModal`/`FormDrawer`
 * (which already keep their own footer fixed below a scrolling body), pass
 * this as the modal/drawer footer — the sticky positioning is then a no-op
 * but the same component and button order stay consistent everywhere.
 */
export function StickyFormActions({ onCancel, cancelText = 'Cancel', onSave, saveText = 'Save', saveLoading, saveDisabled, extra }: StickyFormActionsProps) {
  return (
    <div className="sticky-form-actions">
      {onCancel && <Button onClick={onCancel}>{cancelText}</Button>}
      {extra}
      <Button type="primary" onClick={onSave} loading={saveLoading} disabled={saveDisabled}>
        {saveText}
      </Button>
    </div>
  );
}
