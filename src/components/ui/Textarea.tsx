import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid = false, className, rows = 4, ...rest }, ref) {
    const cls = [
      'sg-textarea',
      invalid ? 'sg-textarea--invalid' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <textarea
        {...rest}
        ref={ref}
        rows={rows}
        className={cls}
        aria-invalid={invalid || undefined}
      />
    );
  },
);
