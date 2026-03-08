import React, { useState } from 'react';
import classNames from 'classnames';
import TabPane from './Tabs.TabPane';
import './style/index.scss';

export type TabsType = 'line' | 'card' | 'editable-card';
export type TabsTabPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  activeKey?: string;
  defaultActiveKey?: string;
  type?: TabsType;
  tabPosition?: TabsTabPosition;
  onChange?: (activeKey: string) => void;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  activeKey,
  defaultActiveKey,
  type = 'line',
  tabPosition = 'top',
  onChange,
  children,
  className,
  ...props
}) => {
  const [currentActiveKey, setCurrentActiveKey] = useState(activeKey || defaultActiveKey || '');

  // 初始化默认激活的 key
  React.useEffect(() => {
    if (!currentActiveKey && React.Children.count(children) > 0) {
      const firstPane = React.Children.find(children, child => 
        React.isValidElement(child) && (child as any).type === TabPane
      );
      if (firstPane) {
        setCurrentActiveKey((firstPane as any).props.key);
      }
    }
  }, [children, currentActiveKey]);

  const handleTabClick = (key: string) => {
    setCurrentActiveKey(key);
    onChange?.(key);
  };

  const tabsClass = classNames('lyf-tabs', {
    [`lyf-tabs-${type}`]: true,
    [`lyf-tabs-${tabPosition}`]: true,
  }, className);

  // 分离 TabPane 子元素
  const tabPanes = React.Children.toArray(children).filter(child => 
    React.isValidElement(child) && (child as any).type === TabPane
  ) as React.ReactElement<any>[];

  return (
    <div className={tabsClass} {...props}>
      <div className="lyf-tabs-header">
        <div className="lyf-tabs-nav">
          {tabPanes.map(pane => {
            const { key, tab, disabled } = pane.props;
            const isActive = key === currentActiveKey;
            const tabClass = classNames('lyf-tabs-tab', {
              'lyf-tabs-tab-active': isActive,
              'lyf-tabs-tab-disabled': disabled,
            });

            return (
              <div
                key={key}
                className={tabClass}
                onClick={() => !disabled && handleTabClick(key)}
              >
                {tab}
              </div>
            );
          })}
        </div>
      </div>
      <div className="lyf-tabs-content">
        {tabPanes.map(pane => {
          const { key, children } = pane.props;
          const isActive = key === currentActiveKey;
          const contentClass = classNames('lyf-tabs-tabpane', {
            'lyf-tabs-tabpane-active': isActive,
          });

          return (
            <div
              key={key}
              className={contentClass}
              style={{
                display: isActive ? 'block' : 'none',
              }}
            >
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Tabs.TabPane = TabPane;

export default Tabs;
