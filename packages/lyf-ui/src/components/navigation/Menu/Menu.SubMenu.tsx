import React, { ReactNode } from 'react';
import classNames from 'classnames';

export interface SubMenuProps extends React.HTMLAttributes<HTMLLIElement> {
  key: string;
  title: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (key: string) => void;
}

export const SubMenu: React.FC<SubMenuProps> = ({
  key,
  title,
  disabled = false,
  children,
  className,
  open = false,
  onOpenChange,
  ...props
}) => {
  const subMenuClass = classNames('lyf-menu-submenu', {
    'lyf-menu-submenu-open': open,
    'lyf-menu-submenu-disabled': disabled,
  }, className);

  const handleTitleClick = () => {
    if (!disabled) {
      onOpenChange?.(key);
    }
  };

  return (
    <li className={subMenuClass} {...props}>
      <div className="lyf-menu-submenu-title" onClick={handleTitleClick}>
        {title}
        <span className="lyf-menu-submenu-arrow">
          {open ? '▼' : '▶'}
        </span>
      </div>
      <ul className="lyf-menu-submenu-list">
        {children}
      </ul>
    </li>
  );
};

export default SubMenu;
