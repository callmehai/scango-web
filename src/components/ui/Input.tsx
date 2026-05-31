import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', invalid = false, leftIcon, rightIcon, className, ...rest },
  ref,
) {
  const cls = [
    'sg-input',
    inputSize === 'sm' ? 'sg-input--sm' : '',
    inputSize === 'lg' ? 'sg-input--lg' : '',
    invalid ? 'sg-input--invalid' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const input = (
    <input
      {...rest}
      ref={ref}
      className={cls}
      aria-invalid={invalid || undefined}
    />
  );

  if (!leftIcon && !rightIcon) return input;

  const wrapCls = [
    'sg-input-wrap',
    leftIcon ? 'sg-input-wrap--has-left' : '',
    rightIcon ? 'sg-input-wrap--has-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={wrapCls}>
      {leftIcon && (
        <span className="sg-input-wrap__icon sg-input-wrap__icon--left" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {input}
      {rightIcon && (
        <span className="sg-input-wrap__icon sg-input-wrap__icon--right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </span>
  );
});
