import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
  Ref,
} from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    as?: 'button';
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    as: 'a';
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  loading: boolean,
  extra?: string,
): string {
  return [
    'sg-btn',
    `sg-btn--${variant}`,
    `sg-btn--${size}`,
    fullWidth ? 'sg-btn--full' : '',
    loading ? 'sg-btn--loading' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

function renderInner(
  loading: boolean,
  variant: ButtonVariant,
  leftIcon: ReactNode,
  rightIcon: ReactNode,
  children: ReactNode,
): ReactNode {
  const spinnerInverse = variant === 'primary' || variant === 'danger';
  return (
    <>
      {loading && (
        <span className="sg-btn__spinner" aria-hidden="true">
          <Spinner size="sm" inverse={spinnerInverse} />
        </span>
      )}
      {leftIcon && !loading && (
        <span className="sg-btn__icon" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className={loading ? 'sg-btn__label--hidden' : undefined}>{children}</span>
      {rightIcon && !loading && (
        <span className="sg-btn__icon" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...rest
    } = props;

    const cls = buildClassName(variant, size, fullWidth, loading, className);
    const inner = renderInner(loading, variant, leftIcon, rightIcon, children);

    if (rest && 'as' in rest && (rest as { as?: string }).as === 'a') {
      const { as: _as, ...anchorRest } = rest as ButtonAsLink;
      void _as;
      return (
        <a
          {...anchorRest}
          ref={ref as Ref<HTMLAnchorElement>}
          className={cls}
          aria-busy={loading || undefined}
          aria-disabled={loading || undefined}
        >
          {inner}
        </a>
      );
    }

    const { as: _as2, disabled, type, ...btnRest } = rest as ButtonAsButton;
    void _as2;
    return (
      <button
        {...btnRest}
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {inner}
      </button>
    );
  },
);
