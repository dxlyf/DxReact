import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

export const Empty: React.FC<EmptyProps> = ({
  image,
  description = '暂无数据',
  extra,
  className,
  ...props
}) => {
  const emptyClass = classNames('lyf-empty', className);

  return (
    <div className={emptyClass} {...props}>
      <div className="lyf-empty-image">
        {image || <div className="lyf-empty-icon">📦</div>}
      </div>
      {description && <div className="lyf-empty-description">{description}</div>}
      {extra && <div className="lyf-empty-extra">{extra}</div>}
    </div>
  );
};

export default Empty;
