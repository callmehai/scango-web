import type { ReactNode } from 'react';
import type { ProgressTone } from './ProgressRing';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: ProgressBarSize;
  /** Bar tone. 'auto' = green/amber/red by fill ratio. Default 'primary'. */
  tone?: ProgressTone;
  /** Accessible label (i18n). */
  label?: string;
  /** Optional left/right meta row under the bar. */
  leftMeta?: ReactNode;
  rightMeta?: ReactNode;
  className?: string;
}

function resolveTone(tone: ProgressTone, ratio: number): string {
  if (tone !== 'auto') return tone === 'primary' ? '' : `sg-progress__bar--${tone}`;
  if (ratio >= 0.9) return 'sg-progress__bar--danger';
  if (ratio >= 0.7) return 'sg-progress__bar--warning';
  return 'sg-progress__bar--success';
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  tone = 'primary',
  label,
  leftMeta,
  rightMeta,
  className,
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const barTone = resolveTone(tone, ratio);

  const cls = ['sg-progress', `sg-progress--${size}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <div
        className="sg-progress__track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeMax)}
        aria-label={label}
      >
        <div
          className={['sg-progress__bar', barTone].filter(Boolean).join(' ')}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {(leftMeta || rightMeta) && (
        <div className="sg-progress__meta">
          <span>{leftMeta}</span>
          <span>{rightMeta}</span>
        </div>
      )}
    </div>
  );
}
