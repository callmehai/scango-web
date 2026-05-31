import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Footer area (buttons). */
  footer?: ReactNode;
  size?: ModalSize;
  /** Show the X close button in the header. Default true. */
  showClose?: boolean;
  /** Close when clicking the backdrop. Default true. */
  closeOnOverlay?: boolean;
  /** Close when pressing Escape. Default true. */
  closeOnEsc?: boolean;
  /** Accessible label for the close button (i18n). */
  closeLabel?: string;
  /** Stack footer buttons vertically on mobile. */
  stackFooter?: boolean;
  className?: string;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  closeLabel = 'Close',
  stackFooter = false,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const node = dialogRef.current;
        if (!node) return;
        const focusable = Array.from(
          node.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (focusable.length === 0) {
          e.preventDefault();
          node.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === node)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [closeOnEsc, onClose],
  );

  // Body scroll lock + focus management while open.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const node = dialogRef.current;
    const focusTarget =
      node?.querySelector<HTMLElement>(FOCUSABLE) ?? node ?? null;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const dialogCls = ['sg-modal', `sg-modal--${size}`, className ?? '']
    .filter(Boolean)
    .join(' ');
  const footerCls = ['sg-modal__footer', stackFooter ? 'sg-modal__footer--stack' : '']
    .filter(Boolean)
    .join(' ');

  const modal = (
    <div
      className="sg-modal-overlay"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={dialogCls}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title || showClose) && (
          <div className="sg-modal__header">
            {title ? (
              <h2 className="sg-modal__title" id={titleId}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                type="button"
                className="sg-modal__close"
                aria-label={closeLabel}
                onClick={onClose}
              >
                &times;
              </button>
            )}
          </div>
        )}
        <div className="sg-modal__body">{children}</div>
        {footer && <div className={footerCls}>{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
