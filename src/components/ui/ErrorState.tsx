import type { ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  /** Error message to show. */
  message: ReactNode;
  /** Optional title above the message. */
  title?: ReactNode;
  /** Icon node. Defaults to a warning glyph. */
  icon?: ReactNode;
  /** When provided, shows a retry button calling this. */
  onRetry?: () => void;
  /** Label for the retry button (i18n). Default "Retry". */
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  message,
  title,
  icon,
  onRetry,
  retryLabel = 'Retry',
  className,
}: ErrorStateProps) {
  const cls = ['sg-error-state', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={cls} role="alert">
      <div className="sg-error-state__icon" aria-hidden="true">
        {icon ?? '!'}
      </div>
      {title && <p className="sg-error-state__title">{title}</p>}
      <p className="sg-error-state__desc">{message}</p>
      {onRetry && (
        <div className="sg-error-state__action">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
