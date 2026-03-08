import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface DescriptionsItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  span?: number;
  children?: ReactNode;
  className?: string;
}

export interface DescriptionsProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  bordered?: boolean;
  column?: number;
  size?: 'small' | 'default' | 'large';
  children?: ReactNode;
  className?: string;
}

export const DescriptionsItem: React.FC<DescriptionsItemProps> = ({
  label,
  span = 1,
  children,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-descriptions-item', {
    [`lyf-descriptions-item-span-${span}`]: span > 1,
  }, className);

  return (
    <div className={itemClass} {...props}>
      {label && <div className="lyf-descriptions-item-label">{label}</div>}
      <div className="lyf-descriptions-item-content">{children}</div>
    </div>
  );
};

export const Descriptions: React.FC<DescriptionsProps> = ({
  title,
  bordered = false,
  column = 3,
  size = 'default',
  children,
  className,
  ...props
}) => {
  const descriptionsClass = classNames('lyf-descriptions', {
    'lyf-descriptions-bordered': bordered,
    [`lyf-descriptions-${size}`]: true,
  }, className);

  return (
    <div className={descriptionsClass} {...props}>
      {title && <div className="lyf-descriptions-title">{title}</div>}
      <div className="lyf-descriptions-body" style={{ gridTemplateColumns: `repeat(${column}, 1fr)` }}>
        {children}
      </div>
    </div>
  );
};

Descriptions.Item = DescriptionsItem;

export default Descriptions;
