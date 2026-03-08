import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface MasonryProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  gutter?: number;
  children?: ReactNode;
  className?: string;
}

export const Masonry: React.FC<MasonryProps> = ({
  columns = 3,
  gutter = 16,
  children,
  className,
  ...props
}) => {
  const masonryClass = classNames('lyf-masonry', className);

  return (
    <div 
      className={masonryClass} 
      style={{ 
        columnCount: columns,
        columnGap: `${gutter}px`,
        rowGap: `${gutter}px`
      }} 
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} className="lyf-masonry-item">
          {child}
        </div>
      ))}
    </div>
  );
};

export default Masonry;
