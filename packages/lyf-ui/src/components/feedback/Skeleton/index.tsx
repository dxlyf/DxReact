import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type SkeletonType = 'text' | 'avatar' | 'button' | 'input' | 'image';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: SkeletonType;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  type = 'text',
  animated = true,
  children,
  className,
  ...props
}) => {
  const skeletonClass = classNames('lyf-skeleton', {
    [`lyf-skeleton-${type}`]: true,
    'lyf-skeleton-animated': animated,
  }, className);

  return (
    <div className={skeletonClass} {...props}>
      {children ? (
        children
      ) : (
        <div className="lyf-skeleton-content">
          {type === 'text' && (
            <>
              <div className="lyf-skeleton-text"></div>
              <div className="lyf-skeleton-text lyf-skeleton-text-short"></div>
              <div className="lyf-skeleton-text lyf-skeleton-text-shorter"></div>
            </>
          )}
          {type === 'avatar' && (
            <div className="lyf-skeleton-avatar"></div>
          )}
          {type === 'button' && (
            <div className="lyf-skeleton-button"></div>
          )}
          {type === 'input' && (
            <div className="lyf-skeleton-input"></div>
          )}
          {type === 'image' && (
            <div className="lyf-skeleton-image"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default Skeleton;
