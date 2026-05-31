import { useState } from 'react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

export type ConfirmTone = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogProps {
  open: boolean;
  /** Called on cancel / overlay / esc / close. */
  onClose: () => void;
  /** Called when the confirm button is pressed. May return a Promise to show
   *  a loading state on the confirm button until it resolves. */
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  message?: ReactNode;
  /** Visual tone for the icon + confirm button. Default 'danger'. */
  tone?: ConfirmTone;
  /** Icon node. Defaults to a tone-appropriate glyph. */
  icon?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Accessible label for the close X (i18n). */
  closeLabel?: string;
}

/** Tone-appropriate line icons (cleaner than bare "!"/"?" glyphs). */
const TONE_ICON: Record<ConfirmTone, ReactNode> = {
  danger: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  warning: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  primary: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const TONE_BTN: Record<ConfirmTone, ButtonVariant> = {
  danger: 'danger',
  warning: 'primary',
  primary: 'primary',
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  tone = 'danger',
  icon,
  confirmLabel,
  cancelLabel,
  closeLabel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      showClose={!loading}
      closeOnOverlay={!loading}
      closeOnEsc={!loading}
      closeLabel={closeLabel}
      title={title}
      stackFooter
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={TONE_BTN[tone]} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="sg-confirm__row">
        <span className={`sg-confirm__icon sg-confirm__icon--${tone}`} aria-hidden="true">
          {icon ?? TONE_ICON[tone]}
        </span>
        {message && <div>{message}</div>}
      </div>
    </Modal>
  );
}
