import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonVariant = 'rect' | 'text' | 'circle';

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: SkeletonVariant;
  /** CSS width, e.g. '100%', 120, '8rem'. */
  width?: number | string;
  /** CSS height, e.g. 16, '1.2em'. */
  height?: number | string;
  /** Border radius override (CSS value). */
  radius?: number | string;
}

function toCss(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  radius,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const cls = [
    'sg-skeleton',
    variant === 'text' ? 'sg-skeleton--text' : '',
    variant === 'circle' ? 'sg-skeleton--circle' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const computed: CSSProperties = {
    width: toCss(width),
    height: toCss(height),
    borderRadius: toCss(radius),
    ...style,
  };

  return (
    <span {...rest} className={cls} style={computed} aria-hidden="true" />
  );
}

export interface SkeletonTextProps {
  /** Number of text lines. Default 3. */
  lines?: number;
  /** Width of the last (short) line. Default '60%'. */
  lastLineWidth?: string;
  className?: string;
}

/** Convenience block of stacked text-line skeletons. */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  className,
}: SkeletonTextProps) {
  const cls = ['sg-skeleton-group', className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={cls} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </span>
  );
}
