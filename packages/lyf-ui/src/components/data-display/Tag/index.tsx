import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type TagType = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type TagSize = 'small' | 'default' | 'large';

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: TagType;
  size?: TagSize;
  color?: string;
  closeable?: boolean;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  type = 'default',
  size = 'default',
  color,
  closeable = false,
  onClose,
  children,
  className,
  ...props
}) => {
  const tagClass = classNames('lyf-tag', {
    [`lyf-tag-${type}`]: true,
    [`lyf-tag-${size}`]: true,
    'lyf-tag-closeable': closeable,
  }, className);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <div 
      className={tagClass} 
      style={{ backgroundColor: color }} 
      {...props}
    >
      <span className="lyf-tag-content">{children}</span>
      {closeable && (
        <button 
          className="lyf-tag-close" 
          onClick={handleClose}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Tag;
