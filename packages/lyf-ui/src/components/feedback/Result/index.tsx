import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type ResultStatus = 'success' | 'error' | 'warning' | 'info';

export interface ResultProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: ResultStatus;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  className?: string;
}

export const Result: React.FC<ResultProps> = ({
  status = 'info',
  title,
  description,
  extra,
  className,
  ...props
}) => {
  const resultClass = classNames('lyf-result', {
    [`lyf-result-${status}`]: true,
  }, className);

  return (
    <div className={resultClass} {...props}>
      <div className="lyf-result-icon">
        {status === 'success' && '✓'}
        {status === 'error' && '✕'}
        {status === 'warning' && '⚠'}
        {status === 'info' && 'ℹ'}
      </div>
      {title && <div className="lyf-result-title">{title}</div>}
      {description && <div className="lyf-result-description">{description}</div>}
      {extra && <div className="lyf-result-extra">{extra}</div>}
    </div>
  );
};

export default Result;
