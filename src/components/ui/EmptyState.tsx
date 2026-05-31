import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon node (emoji, svg, icon component). */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Optional action area (e.g. a <Button />). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const cls = ['sg-empty', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {icon && (
        <div className="sg-empty__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="sg-empty__title">{title}</p>
      {description && <p className="sg-empty__desc">{description}</p>}
      {action && <div className="sg-empty__action">{action}</div>}
    </div>
  );
}
