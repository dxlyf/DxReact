import React, { useState } from 'react';
import classNames from 'classnames';
import MenuItem from './Menu.Item';
import SubMenu from './Menu.SubMenu';
import MenuGroup from './Menu.MenuGroup';
import './style/index.scss';

export type MenuMode = 'horizontal' | 'vertical';
export type MenuTheme = 'light' | 'dark';
export type MenuItemType = 'item' | 'submenu' | 'group';

export interface MenuProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: MenuMode;
  theme?: MenuTheme;
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  openKeys?: string[];
  defaultOpenKeys?: string[];
  onSelect?: (key: string) => void;
  onOpenChange?: (openKeys: string[]) => void;
  children?: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({
  mode = 'vertical',
  theme = 'light',
  selectedKeys = [],
  defaultSelectedKeys = [],
  openKeys = [],
  defaultOpenKeys = [],
  onSelect,
  onOpenChange,
  children,
  className,
  ...props
}) => {
  const [selected, setSelected] = useState<string[]>(selectedKeys.length > 0 ? selectedKeys : defaultSelectedKeys);
  const [open, setOpen] = useState<string[]>(openKeys.length > 0 ? openKeys : defaultOpenKeys);

  const menuClass = classNames('lyf-menu', {
    [`lyf-menu-${mode}`]: true,
    [`lyf-menu-${theme}`]: true,
  }, className);

  const handleSelect = (key: string) => {
    setSelected([key]);
    onSelect?.(key);
  };

  const handleOpenChange = (key: string) => {
    const newOpenKeys = open.includes(key) 
      ? open.filter(k => k !== key)
      : [...open, key];
    setOpen(newOpenKeys);
    onOpenChange?.(newOpenKeys);
  };

  return (
    <div className={menuClass} {...props}>
      <ul>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          const childProps = child.props as any;
          if (child.type === MenuItem) {
            return React.cloneElement(child, {
              selected: selected.includes(childProps.key),
              onSelect: handleSelect,
            });
          } else if (child.type === SubMenu) {
            return React.cloneElement(child, {
              open: open.includes(childProps.key),
              onOpenChange: handleOpenChange,
            });
          }
          return child;
        })}
      </ul>
    </div>
  );
};

Menu.Item = MenuItem;
Menu.SubMenu = SubMenu;
Menu.MenuGroup = MenuGroup;

export default Menu;
