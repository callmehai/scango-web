import type { ReactNode } from 'react';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'auto';

export interface ProgressRingProps {
  /** Progress value. */
  value: number;
  /** Max value. Default 100. */
  max?: number;
  /** Outer diameter in px. Default 96. */
  size?: number;
  /** Stroke thickness in px. Default 8. */
  thickness?: number;
  /** Bar color tone. 'auto' = green/amber/red by fill ratio. Default 'primary'. */
  tone?: ProgressTone;
  /** Center content (e.g. "12/20"). */
  children?: ReactNode;
  /** Accessible label (i18n). */
  label?: string;
  className?: string;
}

function resolveTone(tone: ProgressTone, ratio: number): string {
  if (tone !== 'auto') return tone === 'primary' ? '' : `sg-ring__bar--${tone}`;
  if (ratio >= 0.9) return 'sg-ring__bar--danger';
  if (ratio >= 0.7) return 'sg-ring__bar--warning';
  return 'sg-ring__bar--success';
}

export function ProgressRing({
  value,
  max = 100,
  size = 96,
  thickness = 8,
  tone = 'primary',
  children,
  label,
  className,
}: ProgressRingProps) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);
  const barTone = resolveTone(tone, ratio);

  const cls = ['sg-ring', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={cls}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(safeMax)}
      aria-label={label}
    >
      <svg
        className="sg-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="sg-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
        />
        <circle
          className={['sg-ring__bar', barTone].filter(Boolean).join(' ')}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children != null && (
        <div
          className="sg-ring__label"
          style={{ fontSize: Math.max(12, size * 0.18) }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
