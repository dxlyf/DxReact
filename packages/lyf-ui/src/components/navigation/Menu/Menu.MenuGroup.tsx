import React, { ReactNode } from 'react';
import classNames from 'classnames';

export interface MenuGroupProps extends React.HTMLAttributes<HTMLLIElement> {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const MenuGroup: React.FC<MenuGroupProps> = ({
  title,
  children,
  className,
  ...props
}) => {
  const groupClass = classNames('lyf-menu-group', className);

  return (
    <li className={groupClass} {...props}>
      <div className="lyf-menu-group-title">{title}</div>
      <ul>
        {children}
      </ul>
    </li>
  );
};

export default MenuGroup;
