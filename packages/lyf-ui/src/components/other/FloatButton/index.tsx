import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type FloatButtonType = 'default' | 'primary';

export interface FloatButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  type?: FloatButtonType;
  onClick?: () => void;
  className?: string;
}

export const FloatButton: React.FC<FloatButtonProps> = ({
  icon,
  type = 'default',
  onClick,
  className,
  ...props
}) => {
  const floatButtonClass = classNames('lyf-float-button', {
    [`lyf-float-button-${type}`]: true,
  }, className);

  return (
    <button className={floatButtonClass} onClick={onClick} {...props}>
      {icon || '+'}
    </button>
  );
};

export default FloatButton;
