import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type SpinSize = 'small' | 'default' | 'large';

export interface SpinProps extends React.HTMLAttributes<HTMLDivElement> {
  spinning?: boolean;
  size?: SpinSize;
  tip?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export const Spin: React.FC<SpinProps> = ({
  spinning = true,
  size = 'default',
  tip,
  className,
  children,
  ...props
}) => {
  const spinClass = classNames('lyf-spin', {
    [`lyf-spin-${size}`]: true,
  }, className);

  if (!spinning && children) {
    return <div {...props}>{children}</div>;
  }

  return (
    <div className={spinClass} {...props}>
      <div className="lyf-spin-spinner">
        <div className="lyf-spin-dot"></div>
      </div>
      {tip && <div className="lyf-spin-tip">{tip}</div>}
      {children && (
        <div className="lyf-spin-children">{children}</div>
      )}
    </div>
  );
};

export default Spin;
