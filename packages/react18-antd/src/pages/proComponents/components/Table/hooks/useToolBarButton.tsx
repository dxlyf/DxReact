import React, { useMemo,type ReactElement, type ReactNode } from 'react';
import { useLatest, useMemoizedFn } from 'ahooks';
import { Button,type ButtonProps, Dropdown, Menu, type MenuItemProps } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import type { ProTableProps } from '@ant-design/pro-components';

type ToolBarRender<T>=Extract<ProTableProps<T,any>['toolBarRender'],Function>
export type ToolbarActionHandle<T = any> = (...params: Parameters<ToolBarRender<T>>) => void;
export type ActionConfig<T, K extends ButtonProps | MenuItemProps> = {
  text?: string;
  authKey?: string; // 权限key
  props?: K extends ButtonProps ? ButtonProps : MenuItemProps;
  render?: (d: ActionConfig<T, K>) => ReactElement;
  handle: ToolbarActionHandle;
};

export type ToolBarActionConfig<T> = {
  visible?: boolean;
  actions?: ActionConfig<T, ButtonProps>[];
  menuActions?: ActionConfig<T, MenuItemProps>[];
  render?: ToolBarRender<T>;
};
/**
 * pro table的工具栏的按钮配置
 * @param config
 * @returns
 */
export const useToolBarButton = <T=any>(config: ToolBarActionConfig<T>): ToolBarRender<T> | false => {
  const { visible = true, actions = [], menuActions = [], render } = config;

  const handleCommand = useMemoizedFn((item: ActionConfig<T, ButtonProps | MenuItemProps>, action, rows) => {
    item.handle(action, rows);
  });
  const renderButton: ToolBarRender<T> = (action, rows) => {
    return actions.map((d, i) => {
      const props = {
        onClick: handleCommand.bind(null, d, action, rows),
        key: 'btn_' + i,
        ...(d.props || {}),
      };
      return d.render ? React.cloneElement(d.render(d), props) : <Button {...props}>{d.text}</Button>;
    });
  };
  const renderMenuButton: ToolBarRender<T> = (action, rows) => {
    const newMenuActions = [...menuActions];
    if (newMenuActions.length <= 0) {
      return [] as any;
    }
    // 下拉配置
    const items: any[] = [];
    newMenuActions.map((item, i) => {
      const menuItem = {
        onClick: handleCommand.bind(null, item, action, rows),
        key: 'mune_' + i,
        label: item.render ? item.render(item) : item.text,
        ...(item.props || {}),
      };
      items.push(menuItem);
    });

    return (
      <Dropdown menu={{ items: items }} trigger={['click']} placement="bottomLeft" arrow>
        <Button icon={<CaretDownOutlined />}>操作</Button>
      </Dropdown>
    );
  };
  const toolbarRender = useMemoizedFn((action, rows) => {
    let buttons = [...renderButton(action, rows)].concat(renderMenuButton(action, rows));
    if (render) {
      buttons = buttons.concat(render(action, rows));
    }
    return buttons;
  });

  return visible ? toolbarRender : false;
};
