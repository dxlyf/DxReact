import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type AvatarSize = 'small' | 'default' | 'large';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  shape?: AvatarShape;
  src?: string;
  icon?: ReactNode;
  alt?: string;
  className?: string;
  children?: ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'default',
  shape = 'circle',
  src,
  icon,
  alt = '',
  className,
  children,
  ...props
}) => {
  const avatarClass = classNames('lyf-avatar', {
    [`lyf-avatar-${size}`]: true,
    [`lyf-avatar-${shape}`]: true,
  }, className);

  return (
    <div className={avatarClass} {...props}>
      {src ? (
        <img src={src} alt={alt} className="lyf-avatar-img" />
      ) : icon ? (
        <div className="lyf-avatar-icon">{icon}</div>
      ) : (
        <div className="lyf-avatar-text">{children}</div>
      )}
    </div>
  );
};

export default Avatar;
