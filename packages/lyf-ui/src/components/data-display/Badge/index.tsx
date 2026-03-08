import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type BadgeType = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type BadgeSize = 'small' | 'default' | 'large';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number | ReactNode;
  dot?: boolean;
  overflowCount?: number;
  showZero?: boolean;
  type?: BadgeType;
  size?: BadgeSize;
  children?: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  dot = false,
  overflowCount = 99,
  showZero = false,
  type = 'default',
  size = 'default',
  children,
  className,
  ...props
}) => {
  const getCount = () => {
    if (typeof count === 'number') {
      if (count === 0 && !showZero) {
        return null;
      }
      if (count > overflowCount) {
        return `${overflowCount}+`;
      }
    }
    return count;
  };

  const badgeClass = classNames('lyf-badge', {
    [`lyf-badge-${type}`]: true,
    [`lyf-badge-${size}`]: true,
    'lyf-badge-dot': dot,
  }, className);

  return (
    <div className="lyf-badge-wrapper" {...props}>
      {children}
      {(count !== undefined || dot) && (
        <div className={badgeClass}>
          {!dot && getCount()}
        </div>
      )}
    </div>
  );
};

export default Badge;
