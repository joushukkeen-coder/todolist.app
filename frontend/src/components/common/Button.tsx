import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  children,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      aria-disabled={isDisabled || undefined}
      className={['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {isLoading && <Spinner size="sm" label="처리 중" />}
      <span>{children}</span>
    </button>
  );
}
