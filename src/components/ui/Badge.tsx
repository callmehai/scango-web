import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show a leading status dot. */
  dot?: boolean;
  leftIcon?: ReactNode;
  children?: ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  leftIcon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const cls = [
    'sg-badge',
    `sg-badge--${variant}`,
    size === 'lg' ? 'sg-badge--lg' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...rest} className={cls}>
      {dot && <span className="sg-badge__dot" aria-hidden="true" />}
      {leftIcon && (
        <span className="sg-btn__icon" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
    </span>
  );
}
