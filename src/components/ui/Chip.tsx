import type { HTMLAttributes, ReactNode } from 'react';
import type { BadgeVariant, BadgeSize } from './Badge';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onClick'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  leftIcon?: ReactNode;
  /** Makes the chip clickable (selectable filter). */
  onClick?: () => void;
  /** Shows an "x" remove button; called when pressed. */
  onRemove?: () => void;
  /** Accessible label for the remove button. */
  removeLabel?: string;
  children?: ReactNode;
}

export function Chip({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  leftIcon,
  onClick,
  onRemove,
  removeLabel = 'Remove',
  className,
  children,
  ...rest
}: ChipProps) {
  const clickable = typeof onClick === 'function';
  const cls = [
    'sg-badge',
    'sg-chip',
    `sg-badge--${variant}`,
    size === 'lg' ? 'sg-badge--lg' : '',
    clickable ? 'sg-chip--clickable' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      {...rest}
      className={cls}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {dot && <span className="sg-badge__dot" aria-hidden="true" />}
      {leftIcon && (
        <span className="sg-btn__icon" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          className="sg-chip__remove"
          aria-label={removeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          &times;
        </button>
      )}
    </span>
  );
}
