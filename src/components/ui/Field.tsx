import { useId } from 'react';
import type { ReactNode } from 'react';

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /**
   * Provide an explicit id to link label/hint/error to a control.
   * If omitted, a generated id is created and passed via children render-prop.
   */
  htmlFor?: string;
  /**
   * Children can be a ReactNode, or a render function receiving accessibility
   * ids so the control can wire `id`, `aria-describedby`, `aria-invalid`.
   */
  children:
    | ReactNode
    | ((a11y: {
        id: string;
        describedBy: string | undefined;
        invalid: boolean;
      }) => ReactNode);
}

export function Field({
  label,
  hint,
  error,
  required = false,
  className,
  htmlFor,
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy =
    [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined;

  const cls = ['sg-field', className ?? ''].filter(Boolean).join(' ');

  const content =
    typeof children === 'function'
      ? children({ id, describedBy, invalid })
      : children;

  return (
    <div className={cls}>
      {label && (
        <label className="sg-field__label" htmlFor={id}>
          {label}
          {required && (
            <span className="sg-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {content}
      {error ? (
        <span className="sg-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="sg-field__hint" id={hintId}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
