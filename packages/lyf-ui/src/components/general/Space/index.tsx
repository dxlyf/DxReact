import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type SpaceDirection = 'horizontal' | 'vertical';
export type SpaceSize = 'small' | 'middle' | 'large' | number;

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: SpaceDirection;
  size?: SpaceSize;
  wrap?: boolean;
  children?: React.ReactNode;
}

export const Space: React.FC<SpaceProps> = ({
  direction = 'horizontal',
  size = 'middle',
  wrap = false,
  children,
  className,
  style,
  ...props
}) => {
  const spaceClass = classNames('lyf-space', {
    [`lyf-space-${direction}`]: true,
    'lyf-space-wrap': wrap,
  }, className);

  const sizeStyle = typeof size === 'number' ? { gap: `${size}px` } : {};

  return (
    <div
      className={spaceClass}
      style={{
        '--lyf-space-size': typeof size === 'string' ? `var(--lyf-space-${size})` : undefined,
        ...sizeStyle,
        ...style,
      }}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        return (
          <div key={index} className="lyf-space-item">
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default Space;
