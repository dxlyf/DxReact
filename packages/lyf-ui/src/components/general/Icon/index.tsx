import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type IconType = string;
export type IconSize = 'small' | 'default' | 'large';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: IconType;
  size?: IconSize;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  type,
  size = 'default',
  color,
  className,
  style,
  ...props
}) => {
  const iconClass = classNames('lyf-icon', {
    [`lyf-icon-${type}`]: true,
    [`lyf-icon-${size}`]: true,
  }, className);

  return (
    <span
      className={iconClass}
      style={{
        color,
        ...style,
      }}
      {...props}
    >
      <i className={`lyf-icon-${type}`} />
    </span>
  );
};

export default Icon;
