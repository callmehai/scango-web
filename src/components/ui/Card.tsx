import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Inner padding preset. Default 'md'. */
  padding?: CardPadding;
  /** Lift shadow + border on hover (non-clickable visual cue). */
  hoverable?: boolean;
  /** Clickable card: adds pointer, lift, button-like reset. Pair with onClick/role. */
  interactive?: boolean;
  /** Glassmorphism surface. */
  glass?: boolean;
  /** Render as a different element/component (e.g. 'button', 'a', Link). */
  as?: ElementType;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {
    padding = 'md',
    hoverable = false,
    interactive = false,
    glass = false,
    as,
    className,
    children,
    ...rest
  },
  ref,
) {
  const Tag = (as ?? 'div') as ElementType;
  const cls = [
    'sg-card',
    `sg-card--pad-${padding}`,
    hoverable ? 'sg-card--hoverable' : '',
    interactive ? 'sg-card--interactive' : '',
    glass ? 'sg-card--glass' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag ref={ref} className={cls} {...rest}>
      {children}
    </Tag>
  );
});
