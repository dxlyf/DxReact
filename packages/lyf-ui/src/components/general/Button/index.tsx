import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type ButtonType = 'primary' | 'default' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'large' | 'default' | 'small';
export type ButtonShape = 'default' | 'circle' | 'round';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: ButtonType;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'default',
  size = 'default',
  shape = 'default',
  loading = false,
  disabled = false,
  block = false,
  children,
  className,
  ...props
}) => {
  const btnClass = classNames('lyf-btn', {
    [`lyf-btn-${type}`]: true,
    [`lyf-btn-${size}`]: true,
    [`lyf-btn-${shape}`]: true,
    'lyf-btn-loading': loading,
    'lyf-btn-disabled': disabled,
    'lyf-btn-block': block,
  }, className);

  return (
    <button
      className={btnClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="lyf-btn-loading-icon"></span>}
      {children}
    </button>
  );
};

export default Button;
