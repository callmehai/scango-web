import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: SpinnerSize;
  /** Use light colors for placing on a dark / colored background. */
  inverse?: boolean;
  /** Accessible label announced to screen readers. */
  label?: string;
}

export function Spinner({
  size = 'md',
  inverse = false,
  label,
  className,
  ...rest
}: SpinnerProps) {
  const cls = [
    'sg-spinner',
    `sg-spinner--${size}`,
    inverse ? 'sg-spinner--inverse' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      {...rest}
      className={cls}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    />
  );
}
