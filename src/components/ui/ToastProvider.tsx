import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { ToastContext } from './toastContext';
import type { ToastApi, ToastOptions, ToastVariant } from './toastContext';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const DEFAULT_DURATION = 3500;

const ICON: Record<ToastVariant, string> = {
  success: '✓', // check
  error: '✕', // x
  info: 'i',
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Accessible region label (i18n). Default "Notifications". */
  regionLabel?: string;
  /** Accessible label for each dismiss button (i18n). Default "Dismiss". */
  dismissLabel?: string;
}

export function ToastProvider({
  children,
  regionLabel = 'Notifications',
  dismissLabel = 'Dismiss',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info', options?: ToastOptions) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const duration = options?.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m, o) => show(m, 'success', o),
      error: (m, o) => show(m, 'error', o),
      info: (m, o) => show(m, 'info', o),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="sg-toast-region"
          role="region"
          aria-label={regionLabel}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`sg-toast sg-toast--${t.variant}`}
              role={t.variant === 'error' ? 'alert' : 'status'}
              aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
            >
              <span className="sg-toast__icon" aria-hidden="true">
                {ICON[t.variant]}
              </span>
              <span className="sg-toast__msg">{t.message}</span>
              <button
                type="button"
                className="sg-toast__close"
                aria-label={dismissLabel}
                onClick={() => dismiss(t.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
