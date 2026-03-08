import React, { ReactNode } from 'react';
import classNames from 'classnames';

interface MenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  key?: string;
  title?: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  key,
  title,
  disabled = false,
  children,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-menu-item', {
    'lyf-menu-item-disabled': disabled,
  }, className);

  return (
    <li 
      className={itemClass} 
      key={key} 
      title={title}
      {...props}
    >
      {children}
    </li>
  );
};

export default MenuItem;
