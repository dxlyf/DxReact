import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export type DropdownTrigger = 'click' | 'hover';
export type DropdownPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: DropdownTrigger;
  placement?: DropdownPlacement;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface DropdownItemProps extends React.HTMLAttributes<HTMLLIElement> {
  key?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger = 'hover',
  placement = 'bottom',
  disabled = false,
  children,
  className,
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleTriggerClick = () => {
    if (!disabled) {
      setVisible(!visible);
    }
  };

  const handleTriggerHover = () => {
    if (!disabled && trigger === 'hover') {
      setVisible(true);
    }
  };

  const handleTriggerLeave = () => {
    if (!disabled && trigger === 'hover') {
      setVisible(false);
    }
  };

  const dropdownClass = classNames('lyf-dropdown', {
    'lyf-dropdown-visible': visible,
  }, className);

  const menuClass = classNames('lyf-dropdown-menu', {
    [`lyf-dropdown-menu-${placement}`]: true,
  });

  // 分离 trigger 和 menu 子元素
  const childrenArray = React.Children.toArray(children);
  const triggerElement = childrenArray.find(child => 
    React.isValidElement(child) && (child as any).type !== DropdownMenu
  );
  const menuElement = childrenArray.find(child => 
    React.isValidElement(child) && (child as any).type === DropdownMenu
  );

  return (
    <div ref={containerRef} className={dropdownClass} {...props}>
      <div
        className="lyf-dropdown-trigger"
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerHover}
        onMouseLeave={handleTriggerLeave}
      >
        {triggerElement}
      </div>
      {visible && menuElement && (
        <div ref={menuRef} className={menuClass}>
          {menuElement}
        </div>
      )}
    </div>
  );
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  className,
  ...props
}) => {
  const menuClass = classNames('lyf-dropdown-menu-inner', className);

  return (
    <ul className={menuClass} {...props}>
      {children}
    </ul>
  );
};

export const DropdownItem: React.FC<DropdownItemProps> = ({
  disabled = false,
  children,
  onClick,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-dropdown-item', {
    'lyf-dropdown-item-disabled': disabled,
  }, className);

  const handleClick = (e: React.MouseEvent) => {
    if (!disabled) {
      onClick?.(e);
    }
  };

  return (
    <li className={itemClass} onClick={handleClick} {...props}>
      {children}
    </li>
  );
};

Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;

export default Dropdown;
