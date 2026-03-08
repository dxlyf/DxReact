import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type DividerType = 'horizontal' | 'vertical';
export type DividerOrientation = 'left' | 'center' | 'right';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: DividerType;
  orientation?: DividerOrientation;
  dashed?: boolean;
  children?: React.ReactNode;
}

export const Divider: React.FC<DividerProps> = ({
  type = 'horizontal',
  orientation = 'center',
  dashed = false,
  children,
  className,
  ...props
}) => {
  const dividerClass = classNames('lyf-divider', {
    [`lyf-divider-${type}`]: true,
    [`lyf-divider-${orientation}`]: orientation && type === 'horizontal',
    'lyf-divider-dashed': dashed,
  }, className);

  return (
    <div className={dividerClass} {...props}>
      {children && <span className="lyf-divider-inner-text">{children}</span>}
    </div>
  );
};

export default Divider;
